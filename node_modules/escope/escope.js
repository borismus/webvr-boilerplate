/*
  Copyright (C) 2012-2014 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2013 Alex Seville <hi@alexanderseville.com>
  Copyright (C) 2014 Thiago de Arruda <tpadilha84@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
 * Escope (<a href="http://github.com/Constellation/escope">escope</a>) is an <a
 * href="http://www.ecma-international.org/publications/standards/Ecma-262.htm">ECMAScript</a>
 * scope analyzer extracted from the <a
 * href="http://github.com/Constellation/esmangle">esmangle project</a/>.
 * <p>
 * <em>escope</em> finds lexical scopes in a source program, i.e. areas of that
 * program where different occurrences of the same identifier refer to the same
 * variable. With each scope the contained variables are collected, and each
 * identifier reference in code is linked to its corresponding variable (if
 * possible).
 * <p>
 * <em>escope</em> works on a syntax tree of the parsed source code which has
 * to adhere to the <a
 * href="https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API">
 * Mozilla Parser API</a>. E.g. <a href="http://esprima.org">esprima</a> is a parser
 * that produces such syntax trees.
 * <p>
 * The main interface is the {@link analyze} function.
 * @module
 */

/*jslint bitwise:true */
(function () {
    'use strict';

    var Syntax,
        util,
        extend,
        estraverse,
        esrecurse,
        Map,
        WeakMap;

    util = require('util');
    extend = require('util-extend');
    estraverse = require('estraverse');
    esrecurse = require('esrecurse');

    Map = require('es6-map');
    WeakMap = require('es6-weak-map');

    Syntax = estraverse.Syntax;

    function assert(cond, text) {
        if (!cond) {
            throw new Error(text);
        }
    }

    function defaultOptions() {
        return {
            optimistic: false,
            directive: false,
            nodejsScope: false,
            sourceType: 'script',  // one of ['script', 'module']
            ecmaVersion: 5
        };
    }

    function updateDeeply(target, override) {
        var key, val;

        function isHashObject(target) {
            return typeof target === 'object' && target instanceof Object && !(target instanceof RegExp);
        }

        for (key in override) {
            if (override.hasOwnProperty(key)) {
                val = override[key];
                if (isHashObject(val)) {
                    if (isHashObject(target[key])) {
                        updateDeeply(target[key], val);
                    } else {
                        target[key] = updateDeeply({}, val);
                    }
                } else {
                    target[key] = val;
                }
            }
        }
        return target;
    }

    /**
     * A Reference represents a single occurrence of an identifier in code.
     * @class Reference
     */
    function Reference(ident, scope, flag, writeExpr, maybeImplicitGlobal, partial) {
        /**
         * Identifier syntax node.
         * @member {esprima#Identifier} Reference#identifier
         */
        this.identifier = ident;
        /**
         * Reference to the enclosing Scope.
         * @member {Scope} Reference#from
         */
        this.from = scope;
        /**
         * Whether the reference comes from a dynamic scope (such as 'eval',
         * 'with', etc.), and may be trapped by dynamic scopes.
         * @member {boolean} Reference#tainted
         */
        this.tainted = false;
        /**
         * The variable this reference is resolved with.
         * @member {Variable} Reference#resolved
         */
        this.resolved = null;
        /**
         * The read-write mode of the reference. (Value is one of {@link
         * Reference.READ}, {@link Reference.RW}, {@link Reference.WRITE}).
         * @member {number} Reference#flag
         * @private
         */
        this.flag = flag;
        if (this.isWrite()) {
            /**
             * If reference is writeable, this is the tree being written to it.
             * @member {esprima#Node} Reference#writeExpr
             */
            this.writeExpr = writeExpr;
            /**
             * Whether the Reference might refer to a partial value of writeExpr.
             * @member {boolean} Reference#partial
             */
            this.partial = partial;
        }
        this.__maybeImplicitGlobal = maybeImplicitGlobal;
    }

    /**
     * @constant Reference.READ
     * @private
     */
    Reference.READ = 0x1;
    /**
     * @constant Reference.WRITE
     * @private
     */
    Reference.WRITE = 0x2;
    /**
     * @constant Reference.RW
     * @private
     */
    Reference.RW = Reference.READ | Reference.WRITE;

    /**
     * Whether the reference is static.
     * @method Reference#isStatic
     * @return {boolean}
     */
    Reference.prototype.isStatic = function isStatic() {
        return !this.tainted && this.resolved && this.resolved.scope.isStatic();
    };

    /**
     * Whether the reference is writeable.
     * @method Reference#isWrite
     * @return {boolean}
     */
    Reference.prototype.isWrite = function isWrite() {
        return !!(this.flag & Reference.WRITE);
    };

    /**
     * Whether the reference is readable.
     * @method Reference#isRead
     * @return {boolean}
     */
    Reference.prototype.isRead = function isRead() {
        return !!(this.flag & Reference.READ);
    };

    /**
     * Whether the reference is read-only.
     * @method Reference#isReadOnly
     * @return {boolean}
     */
    Reference.prototype.isReadOnly = function isReadOnly() {
        return this.flag === Reference.READ;
    };

    /**
     * Whether the reference is write-only.
     * @method Reference#isWriteOnly
     * @return {boolean}
     */
    Reference.prototype.isWriteOnly = function isWriteOnly() {
        return this.flag === Reference.WRITE;
    };

    /**
     * Whether the reference is read-write.
     * @method Reference#isReadWrite
     * @return {boolean}
     */
    Reference.prototype.isReadWrite = function isReadWrite() {
        return this.flag === Reference.RW;
    };

    /**
     * A Variable represents a locally scoped identifier. These include arguments to
     * functions.
     * @class Variable
     */
    function Variable(name, scope) {
        /**
         * The variable name, as given in the source code.
         * @member {String} Variable#name
         */
        this.name = name;
        /**
         * List of defining occurrences of this variable (like in 'var ...'
         * statements or as parameter), as AST nodes.
         * @member {esprima.Identifier[]} Variable#identifiers
         */
        this.identifiers = [];
        /**
         * List of {@link Reference|references} of this variable (excluding parameter entries)
         * in its defining scope and all nested scopes. For defining
         * occurrences only see {@link Variable#defs}.
         * @member {Reference[]} Variable#references
         */
        this.references = [];

        /**
         * List of defining occurrences of this variable (like in 'var ...'
         * statements or as parameter), as custom objects.
         * @typedef {Object} DefEntry
         * @property {String} DefEntry.type - the type of the occurrence (e.g.
         *      "Parameter", "Variable", ...)
         * @property {esprima.Identifier} DefEntry.name - the identifier AST node of the occurrence
         * @property {esprima.Node} DefEntry.node - the enclosing node of the
         *      identifier
         * @property {esprima.Node} [DefEntry.parent] - the enclosing statement
         *      node of the identifier
         * @member {DefEntry[]} Variable#defs
         */
        this.defs = [];

        this.tainted = false;
        /**
         * Whether this is a stack variable.
         * @member {boolean} Variable#stack
         */
        this.stack = true;
        /**
         * Reference to the enclosing Scope.
         * @member {Scope} Variable#scope
         */
        this.scope = scope;
    }

    Variable.CatchClause = 'CatchClause';
    Variable.Parameter = 'Parameter';
    Variable.FunctionName = 'FunctionName';
    Variable.ClassName = 'ClassName';
    Variable.Variable = 'Variable';
    Variable.ImportBinding = 'ImportBinding';
    Variable.TDZ = 'TDZ';
    Variable.ImplicitGlobalVariable = 'ImplicitGlobalVariable';

    function isStrictScope(scope, block, isMethodDefinition, useDirective) {
        var body, i, iz, stmt, expr;

        // When upper scope is exists and strict, inner scope is also strict.
        if (scope.upper && scope.upper.isStrict) {
            return true;
        }

        // ArrowFunctionExpression's scope is always strict scope.
        if (block.type === Syntax.ArrowFunctionExpression) {
            return true;
        }

        if (isMethodDefinition) {
            return true;
        }

        if (scope.type === 'class' || scope.type === 'module') {
            return true;
        }

        if (scope.type === 'block' || scope.type === 'switch') {
            return false;
        }

        if (scope.type === 'function') {
            if (block.type === 'Program') {
                body = block;
            } else {
                body = block.body;
            }
        } else if (scope.type === 'global') {
            body = block;
        } else {
            return false;
        }

        // Search 'use strict' directive.
        if (useDirective) {
            for (i = 0, iz = body.body.length; i < iz; ++i) {
                stmt = body.body[i];
                if (stmt.type !== 'DirectiveStatement') {
                    break;
                }
                if (stmt.raw === '"use strict"' || stmt.raw === '\'use strict\'') {
                    return true;
                }
            }
        } else {
            for (i = 0, iz = body.body.length; i < iz; ++i) {
                stmt = body.body[i];
                if (stmt.type !== Syntax.ExpressionStatement) {
                    break;
                }
                expr = stmt.expression;
                if (expr.type !== Syntax.Literal || typeof expr.value !== 'string') {
                    break;
                }
                if (expr.raw != null) {
                    if (expr.raw === '"use strict"' || expr.raw === '\'use strict\'') {
                        return true;
                    }
                } else {
                    if (expr.value === 'use strict') {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function registerScope(scopeManager, scope) {
        var scopes;

        scopeManager.scopes.push(scope);

        scopes = scopeManager.__nodeToScope.get(scope.block);
        if (scopes) {
            scopes.push(scope);
        } else {
            scopeManager.__nodeToScope.set(scope.block, [ scope ]);
        }
    }

    /* Special Scope types. */
    var SCOPE_NORMAL = 0,
        SCOPE_MODULE = 1,
        SCOPE_FUNCTION_EXPRESSION_NAME = 2,
        SCOPE_TDZ = 3,
        SCOPE_FUNCTION = 4;

    /**
     * @class Scope
     */
    function Scope(scopeManager, block, isMethodDefinition, scopeType) {
        /**
         * One of 'catch', 'with', 'function', 'global' or 'block'.
         * @member {String} Scope#type
         */
        this.type =
            (scopeType === SCOPE_TDZ) ? 'TDZ' :
            (scopeType === SCOPE_MODULE) ? 'module' :
            (block.type === Syntax.BlockStatement) ? 'block' :
            (block.type === Syntax.SwitchStatement) ? 'switch' :
            (scopeType === SCOPE_FUNCTION || block.type === Syntax.FunctionExpression || block.type === Syntax.FunctionDeclaration || block.type === Syntax.ArrowFunctionExpression) ? 'function' :
            (block.type === Syntax.CatchClause) ? 'catch' :
            (block.type === Syntax.ForInStatement || block.type === Syntax.ForOfStatement || block.type === Syntax.ForStatement) ? 'for' :
            (block.type === Syntax.WithStatement) ? 'with' :
            (block.type === Syntax.ClassExpression || block.type === Syntax.ClassDeclaration) ? 'class' : 'global';
         /**
         * The scoped {@link Variable}s of this scope, as <code>{ Variable.name
         * : Variable }</code>.
         * @member {Map} Scope#set
         */
        this.set = new Map();
        /**
         * The tainted variables of this scope, as <code>{ Variable.name :
         * boolean }</code>.
         * @member {Map} Scope#taints */
        this.taints = new Map();
        /**
         * Generally, through the lexical scoping of JS you can always know
         * which variable an identifier in the source code refers to. There are
         * a few exceptions to this rule. With 'global' and 'with' scopes you
         * can only decide at runtime which variable a reference refers to.
         * Moreover, if 'eval()' is used in a scope, it might introduce new
         * bindings in this or its prarent scopes.
         * All those scopes are considered 'dynamic'.
         * @member {boolean} Scope#dynamic
         */
        this.dynamic = this.type === 'global' || this.type === 'with';
        /**
         * A reference to the scope-defining syntax node.
         * @member {esprima.Node} Scope#block
         */
        this.block = block;
         /**
         * The {@link Reference|references} that are not resolved with this scope.
         * @member {Reference[]} Scope#through
         */
        this.through = [];
         /**
         * The scoped {@link Variable}s of this scope. In the case of a
         * 'function' scope this includes the automatic argument <em>arguments</em> as
         * its first element, as well as all further formal arguments.
         * @member {Variable[]} Scope#variables
         */
        this.variables = [];
         /**
         * Any variable {@link Reference|reference} found in this scope. This
         * includes occurrences of local variables as well as variables from
         * parent scopes (including the global scope). For local variables
         * this also includes defining occurrences (like in a 'var' statement).
         * In a 'function' scope this does not include the occurrences of the
         * formal parameter in the parameter list.
         * @member {Reference[]} Scope#references
         */
        this.references = [];

         /**
         * For 'global' and 'function' scopes, this is a self-reference. For
         * other scope types this is the <em>variableScope</em> value of the
         * parent scope.
         * @member {Scope} Scope#variableScope
         */
        this.variableScope =
            (this.type === 'global' || this.type === 'function' || this.type === 'module') ? this : scopeManager.__currentScope.variableScope;
         /**
         * Whether this scope is created by a FunctionExpression.
         * @member {boolean} Scope#functionExpressionScope
         */
        this.functionExpressionScope = false;
         /**
         * Whether this is a scope that contains an 'eval()' invocation.
         * @member {boolean} Scope#directCallToEvalScope
         */
        this.directCallToEvalScope = false;
         /**
         * @member {boolean} Scope#thisFound
         */
        this.thisFound = false;

        this.__left = [];

        if (scopeType === SCOPE_FUNCTION_EXPRESSION_NAME) {
            this.__define(block.id, {
                type: Variable.FunctionName,
                name: block.id,
                node: block
            });
            this.functionExpressionScope = true;
        } else {
            // section 9.2.13, FunctionDeclarationInstantiation.
            // NOTE Arrow functions never have an arguments objects.
            if (this.type === 'function' && this.block.type !== Syntax.ArrowFunctionExpression) {
                this.__defineArguments();
            }

            if (block.type === Syntax.FunctionExpression && block.id) {
                scopeManager.__nestFunctionExpressionNameScope(block, isMethodDefinition);
            }
        }

         /**
         * Reference to the parent {@link Scope|scope}.
         * @member {Scope} Scope#upper
         */
        this.upper = scopeManager.__currentScope;
         /**
         * Whether 'use strict' is in effect in this scope.
         * @member {boolean} Scope#isStrict
         */
        this.isStrict = isStrictScope(this, block, isMethodDefinition, scopeManager.__useDirective());

         /**
         * List of nested {@link Scope}s.
         * @member {Scope[]} Scope#childScopes
         */
        this.childScopes = [];
        if (scopeManager.__currentScope) {
            scopeManager.__currentScope.childScopes.push(this);
        }


        // RAII
        scopeManager.__currentScope = this;
        if (this.type === 'global') {
            scopeManager.globalScope = this;
            scopeManager.globalScope.implicit = {
                set: new Map(),
                variables: [],
                /**
                * List of {@link Reference}s that are left to be resolved (i.e. which
                * need to be linked to the variable they refer to).
                * @member {Reference[]} Scope#implicit#left
                */
                left: []
            };
        }

        registerScope(scopeManager, this);
    }

    Scope.prototype.__close = function __close(scopeManager) {
        var i, iz, ref, current, implicit, info;

        // Because if this is global environment, upper is null
        if (!this.dynamic || scopeManager.__isOptimistic()) {
            // static resolve
            for (i = 0, iz = this.__left.length; i < iz; ++i) {
                ref = this.__left[i];
                if (!this.__resolve(ref)) {
                    this.__delegateToUpperScope(ref);
                }
            }
        } else {
            // this is "global" / "with" / "function with eval" environment
            if (this.type === 'with') {
                for (i = 0, iz = this.__left.length; i < iz; ++i) {
                    ref = this.__left[i];
                    ref.tainted = true;
                    this.__delegateToUpperScope(ref);
                }
            } else {
                for (i = 0, iz = this.__left.length; i < iz; ++i) {
                    // notify all names are through to global
                    ref = this.__left[i];
                    current = this;
                    do {
                        current.through.push(ref);
                        current = current.upper;
                    } while (current);
                }
            }
        }

        if (this.type === 'global') {
            implicit = [];
            for (i = 0, iz = this.__left.length; i < iz; ++i) {
                ref = this.__left[i];
                if (ref.__maybeImplicitGlobal && !this.set.has(ref.identifier.name)) {
                    implicit.push(ref.__maybeImplicitGlobal);
                }
            }

            // create an implicit global variable from assignment expression
            for (i = 0, iz = implicit.length; i < iz; ++i) {
                info = implicit[i];
                this.__defineImplicit(info.pattern, {
                    type: Variable.ImplicitGlobalVariable,
                    name: info.pattern,
                    node: info.node
                });
            }

            this.implicit.left = this.__left;
        }

        this.__left = null;
        scopeManager.__currentScope = this.upper;
    };

    Scope.prototype.__resolve = function __resolve(ref) {
        var variable, name;
        name = ref.identifier.name;
        if (this.set.has(name)) {
            variable = this.set.get(name);
            variable.references.push(ref);
            variable.stack = variable.stack && ref.from.variableScope === this.variableScope;
            if (ref.tainted) {
                variable.tainted = true;
                this.taints.set(variable.name, true);
            }
            ref.resolved = variable;
            return true;
        }
        return false;
    };

    Scope.prototype.__delegateToUpperScope = function __delegateToUpperScope(ref) {
        if (this.upper) {
            this.upper.__left.push(ref);
        }
        this.through.push(ref);
    };

    Scope.prototype.__defineGeneric = function (name, set, variables, node, info) {
        var variable;

        variable = set.get(name);
        if (!variable) {
            variable = new Variable(name, this);
            set.set(name, variable);
            variables.push(variable);
        }

        if (info) {
            variable.defs.push(info);
        }
        if (node) {
            variable.identifiers.push(node);
        }
    };

    Scope.prototype.__defineArguments = function () {
        this.__defineGeneric('arguments', this.set, this.variables);
        this.taints.set('arguments', true);
    };

    Scope.prototype.__defineImplicit = function (node, info) {
        if (node && node.type === Syntax.Identifier) {
            this.__defineGeneric(node.name, this.implicit.set, this.implicit.variables, node, info);
        }
    };

    Scope.prototype.__define = function (node, info) {
        if (node && node.type === Syntax.Identifier) {
            this.__defineGeneric(node.name, this.set, this.variables, node, info);
        }
    };

    Scope.prototype.__referencing = function __referencing(node, assign, writeExpr, maybeImplicitGlobal, partial) {
        var ref;
        // because Array element may be null
        if (!node || node.type !== Syntax.Identifier) {
            return;
        }

        // Specially handle like `this`.
        if (node.name === 'super') {
            return;
        }

        ref = new Reference(node, this, assign || Reference.READ, writeExpr, maybeImplicitGlobal, !!partial);
        this.references.push(ref);
        this.__left.push(ref);
    };

    Scope.prototype.__detectEval = function __detectEval() {
        var current;
        current = this;
        this.directCallToEvalScope = true;
        do {
            current.dynamic = true;
            current = current.upper;
        } while (current);
    };

    Scope.prototype.__detectThis = function __detectThis() {
        this.thisFound = true;
    };

    Scope.prototype.__isClosed = function isClosed() {
        return this.__left === null;
    };

    // API Scope#resolve(name)
    // returns resolved reference
    Scope.prototype.resolve = function resolve(ident) {
        var ref, i, iz;
        assert(this.__isClosed(), 'scope should be closed');
        assert(ident.type === Syntax.Identifier, 'target should be identifier');
        for (i = 0, iz = this.references.length; i < iz; ++i) {
            ref = this.references[i];
            if (ref.identifier === ident) {
                return ref;
            }
        }
        return null;
    };

    // API Scope#isStatic
    // returns this scope is static
    Scope.prototype.isStatic = function isStatic() {
        return !this.dynamic;
    };

    // API Scope#isArgumentsMaterialized
    // return this scope has materialized arguments
    Scope.prototype.isArgumentsMaterialized = function isArgumentsMaterialized() {
        // TODO(Constellation)
        // We can more aggressive on this condition like this.
        //
        // function t() {
        //     // arguments of t is always hidden.
        //     function arguments() {
        //     }
        // }
        var variable;

        // This is not function scope
        if (this.type !== 'function') {
            return true;
        }

        if (!this.isStatic()) {
            return true;
        }

        variable = this.set.get('arguments');
        assert(variable, 'always have arguments variable');
        return variable.tainted || variable.references.length  !== 0;
    };

    // API Scope#isThisMaterialized
    // return this scope has materialized `this` reference
    Scope.prototype.isThisMaterialized = function isThisMaterialized() {
        // This is not function scope
        if (this.type !== 'function') {
            return true;
        }
        if (!this.isStatic()) {
            return true;
        }
        return this.thisFound;
    };

    Scope.prototype.isUsedName = function (name) {
        if (this.set.has(name)) {
            return true;
        }
        for (var i = 0, iz = this.through.length; i < iz; ++i) {
            if (this.through[i].identifier.name === name) {
                return true;
            }
        }
        return false;
    };

    /**
     * @class ScopeManager
     */
    function ScopeManager(options) {
        this.scopes = [];
        this.globalScope = null;
        this.__nodeToScope = new WeakMap();
        this.__currentScope = null;
        this.__options = options;
    }

    ScopeManager.prototype.__useDirective = function () {
        return this.__options.directive;
    };

    ScopeManager.prototype.__isOptimistic = function () {
        return this.__options.optimistic;
    };

    ScopeManager.prototype.__ignoreEval = function () {
        return this.__options.ignoreEval;
    };

    ScopeManager.prototype.__isNodejsScope = function () {
        return this.__options.nodejsScope;
    };

    ScopeManager.prototype.isModule = function () {
        return this.__options.sourceType === 'module';
    };

    // Returns appropliate scope for this node.
    ScopeManager.prototype.__get = function __get(node) {
        return this.__nodeToScope.get(node);
    };

    ScopeManager.prototype.acquire = function acquire(node, inner) {
        var scopes, scope, i, iz;

        function predicate(scope) {
            if (scope.type === 'function' && scope.functionExpressionScope) {
                return false;
            }
            if (scope.type === 'TDZ') {
                return false;
            }
            return true;
        }

        scopes = this.__get(node);
        if (!scopes || scopes.length === 0) {
            return null;
        }

        // Heuristic selection from all scopes.
        // If you would like to get all scopes, please use ScopeManager#acquireAll.
        if (scopes.length === 1) {
            return scopes[0];
        }

        if (inner) {
            for (i = scopes.length - 1; i >= 0; --i) {
                scope = scopes[i];
                if (predicate(scope)) {
                    return scope;
                }
            }
        } else {
            for (i = 0, iz = scopes.length; i < iz; ++i) {
                scope = scopes[i];
                if (predicate(scope)) {
                    return scope;
                }
            }
        }

        return null;
    };

    ScopeManager.prototype.acquireAll = function acquire(node) {
        return this.__get(node);
    };

    ScopeManager.prototype.release = function release(node, inner) {
        var scopes, scope;
        scopes = this.__get(node);
        if (scopes && scopes.length) {
            scope = scopes[0].upper;
            if (!scope) {
                return null;
            }
            return this.acquire(scope.block, inner);
        }
        return null;
    };

    ScopeManager.prototype.attach = function attach() { };

    ScopeManager.prototype.detach = function detach() { };

    ScopeManager.prototype.__nestScope = function (node, isMethodDefinition) {
        return new Scope(this, node, isMethodDefinition, SCOPE_NORMAL);
    };

    ScopeManager.prototype.__nestForceFunctionScope = function (node) {
        return new Scope(this, node, false, SCOPE_FUNCTION);
    };

    ScopeManager.prototype.__nestModuleScope = function (node) {
        return new Scope(this, node, false, SCOPE_MODULE);
    };

    ScopeManager.prototype.__nestTDZScope = function (node) {
        return new Scope(this, node, false, SCOPE_TDZ);
    };

    ScopeManager.prototype.__nestFunctionExpressionNameScope = function (node, isMethodDefinition) {
        return new Scope(this, node, isMethodDefinition, SCOPE_FUNCTION_EXPRESSION_NAME);
    };

    ScopeManager.prototype.__isES6 = function () {
        return this.__options.ecmaVersion >= 6;
    };

    function traverseIdentifierInPattern(rootPattern, callback) {
        estraverse.traverse(rootPattern, {
            enter: function (pattern, parent) {
                var i, iz, element, property;

                switch (pattern.type) {
                    case Syntax.Identifier:
                        // Toplevel identifier.
                        if (parent === null) {
                            callback(pattern, true);
                        }
                        break;

                    case Syntax.SpreadElement:
                        if (pattern.argument.type === Syntax.Identifier) {
                            callback(pattern.argument, false);
                        }
                        break;

                    case Syntax.ObjectPattern:
                        for (i = 0, iz = pattern.properties.length; i < iz; ++i) {
                            property = pattern.properties[i];
                            if (property.shorthand) {
                                callback(property.key, false);
                                continue;
                            }
                            if (property.value.type === Syntax.Identifier) {
                                callback(property.value, false);
                                continue;
                            }
                        }
                        break;

                    case Syntax.ArrayPattern:
                        for (i = 0, iz = pattern.elements.length; i < iz; ++i) {
                            element = pattern.elements[i];
                            if (element && element.type === Syntax.Identifier) {
                                callback(element, false);
                            }
                        }
                        break;
                }
            }
        });
    }

    function isPattern(node) {
        var nodeType = node.type;
        return nodeType === Syntax.Identifier || nodeType === Syntax.ObjectPattern || nodeType === Syntax.ArrayPattern || nodeType === Syntax.SpreadElement;
    }

    // Importing ImportDeclaration.
    // http://people.mozilla.org/~jorendorff/es6-draft.html#sec-moduledeclarationinstantiation
    // FIXME: Now, we don't create module environment, because the context is
    // implementation dependent.

    function Importer(declaration, referencer) {
        esrecurse.Visitor.call(this, this);
        this.declaration = declaration;
        this.referencer = referencer;
    }
    util.inherits(Importer, esrecurse.Visitor);

    Importer.prototype.visitImport = function (id, specifier) {
        var that = this;
        that.referencer.visitPattern(id, function (pattern) {
            that.referencer.currentScope().__define(pattern, {
                type: Variable.ImportBinding,
                name: pattern,
                node: specifier,
                parent: that.declaration
            });
        });
    };

    Importer.prototype.ImportNamespaceSpecifier = function (node) {
        var local = (node.local || node.id);
        if (local) {
            this.visitImport(local, node);
        }
    };

    Importer.prototype.ImportDefaultSpecifier = function (node) {
        var local = (node.local || node.id);
        this.visitImport(local, node);
    };

    Importer.prototype.ImportSpecifier = function (node) {
        var local = (node.local || node.id);
        if (node.name) {
            this.visitImport(node.name, node);
        } else {
            this.visitImport(local, node);
        }
    };

    // Referencing variables and creating bindings.

    function Referencer(scopeManager) {
        esrecurse.Visitor.call(this, this);
        this.scopeManager = scopeManager;
        this.parent = null;
        this.isInnerMethodDefinition = false;
    }

    util.inherits(Referencer, esrecurse.Visitor);

    extend(Referencer.prototype, {
        currentScope: function () {
            return this.scopeManager.__currentScope;
        },

        close: function (node) {
            while (this.currentScope() && node === this.currentScope().block) {
                this.currentScope().__close(this.scopeManager);
            }
        },

        pushInnerMethodDefinition: function (isInnerMethodDefinition) {
            var previous = this.isInnerMethodDefinition;
            this.isInnerMethodDefinition = isInnerMethodDefinition;
            return previous;
        },

        popInnerMethodDefinition: function (isInnerMethodDefinition) {
            this.isInnerMethodDefinition = isInnerMethodDefinition;
        },

        materializeTDZScope: function (node, iterationNode) {
            // http://people.mozilla.org/~jorendorff/es6-draft.html#sec-runtime-semantics-forin-div-ofexpressionevaluation-abstract-operation
            // TDZ scope hides the declaration's names.
            this.scopeManager.__nestTDZScope(node, iterationNode);
            this.visitVariableDeclaration(this.currentScope(), Variable.TDZ, iterationNode.left, 0);
        },

        materializeIterationScope: function (node) {
            // Generate iteration scope for upper ForIn/ForOf Statements.
            // parent node for __nestScope is only necessary to
            // distinguish MethodDefinition.
            var letOrConstDecl, that = this;
            this.scopeManager.__nestScope(node, false);
            letOrConstDecl = node.left;
            this.visitVariableDeclaration(this.currentScope(), Variable.Variable, letOrConstDecl, 0);
            this.visitPattern(letOrConstDecl.declarations[0].id, function (pattern) {
                that.currentScope().__referencing(pattern, Reference.WRITE, node.right, null, true);
            });
        },

        visitPattern: function (node, callback) {
            traverseIdentifierInPattern(node, callback);
        },

        visitFunction: function (node) {
            var i, iz, that = this;
            // FunctionDeclaration name is defined in upper scope
            // NOTE: Not referring variableScope. It is intended.
            // Since
            //  in ES5, FunctionDeclaration should be in FunctionBody.
            //  in ES6, FunctionDeclaration should be block scoped.
            if (node.type === Syntax.FunctionDeclaration) {
                // id is defined in upper scope
                this.currentScope().__define(node.id, {
                    type: Variable.FunctionName,
                    name: node.id,
                    node: node
                });
            }

            // Consider this function is in the MethodDefinition.
            this.scopeManager.__nestScope(node, this.isInnerMethodDefinition);

            for (i = 0, iz = node.params.length; i < iz; ++i) {
                this.visitPattern(node.params[i], function (pattern) {
                    that.currentScope().__define(pattern, {
                        type: Variable.Parameter,
                        name: pattern,
                        node: node,
                        index: i,
                        rest: false
                    });
                });
            }


            // if there's a rest argument, add that
            if (node.rest) {
                this.visitPattern(node.rest, function (pattern) {
                    that.currentScope().__define(pattern, {
                        type: Variable.Parameter,
                        name: pattern,
                        node: node,
                        index: node.params.length,
                        rest: true
                    });
                });
            }

            // Skip BlockStatement to prevent creating BlockStatement scope.
            if (node.body.type === Syntax.BlockStatement) {
                this.visitChildren(node.body);
            } else {
                this.visit(node.body);
            }

            this.close(node);
        },

        visitClass: function (node) {
            if (node.type === Syntax.ClassDeclaration) {
                this.currentScope().__define(node.id, {
                    type: Variable.ClassName,
                    name: node.id,
                    node: node
                });
            }

            // FIXME: Maybe consider TDZ.
            this.visit(node.superClass);

            this.scopeManager.__nestScope(node);

            if (node.id) {
                this.currentScope().__define(node.id, {
                    type: Variable.ClassName,
                    name: node.id,
                    node: node
                });
            }
            this.visit(node.body);

            this.close(node);
        },

        visitProperty: function (node) {
            var previous, isMethodDefinition;
            if (node.computed) {
                this.visit(node.key);
            }

            isMethodDefinition = node.type === Syntax.MethodDefinition || node.method;
            if (isMethodDefinition) {
                previous = this.pushInnerMethodDefinition(true);
            }
            this.visit(node.value);
            if (isMethodDefinition) {
                this.popInnerMethodDefinition(previous);
            }
        },

        visitForIn: function (node) {
            var that = this;
            if (node.left.type === Syntax.VariableDeclaration && node.left.kind !== 'var') {
                this.materializeTDZScope(node.right, node);
                this.visit(node.right);
                this.close(node.right);

                this.materializeIterationScope(node);
                this.visit(node.body);
                this.close(node);
            } else {
                if (node.left.type === Syntax.VariableDeclaration) {
                    this.visit(node.left);
                    this.visitPattern(node.left.declarations[0].id, function (pattern) {
                        that.currentScope().__referencing(pattern, Reference.WRITE, node.right, null, true);
                    });
                } else {
                    if (!isPattern(node.left)) {
                        this.visit(node.left);
                    }
                    this.visitPattern(node.left, function (pattern) {
                        var maybeImplicitGlobal = null;
                        if (!that.currentScope().isStrict) {
                            maybeImplicitGlobal = {
                                pattern: pattern,
                                node: node
                            };
                        }
                        that.currentScope().__referencing(pattern, Reference.WRITE, node.right, maybeImplicitGlobal, true);
                    });
                }
                this.visit(node.right);
                this.visit(node.body);
            }
        },

        visitVariableDeclaration: function (variableTargetScope, type, node, index) {
            var decl, init, that = this;

            decl = node.declarations[index];
            init = decl.init;
            // FIXME: Don't consider initializer with complex patterns.
            // Such as,
            // var [a, b, c = 20] = array;
            this.visitPattern(decl.id, function (pattern, toplevel) {
                variableTargetScope.__define(pattern, {
                    type: type,
                    name: pattern,
                    node: decl,
                    index: index,
                    kind: node.kind,
                    parent: node
                });

                if (init) {
                    that.currentScope().__referencing(pattern, Reference.WRITE, init, null, !toplevel);
                }
            });
        },

        AssignmentExpression: function (node) {
            var that = this;
            if (isPattern(node.left)) {
                if (node.operator === '=') {
                    this.visitPattern(node.left, function (pattern, toplevel) {
                        var maybeImplicitGlobal = null;
                        if (!that.currentScope().isStrict) {
                            maybeImplicitGlobal = {
                                pattern: pattern,
                                node: node
                            };
                        }
                        that.currentScope().__referencing(pattern, Reference.WRITE, node.right, maybeImplicitGlobal, !toplevel);
                    });
                } else {
                    that.currentScope().__referencing(node.left, Reference.RW, node.right);
                }
            } else {
                this.visit(node.left);
            }
            this.visit(node.right);
        },

        CatchClause: function (node) {
            var that = this;
            this.scopeManager.__nestScope(node);

            this.visitPattern(node.param, function (pattern) {
                that.currentScope().__define(pattern, {
                    type: Variable.CatchClause,
                    name: node.param,
                    node: node
                });
            });
            this.visit(node.body);

            this.close(node);
        },

        Program: function (node) {
            this.scopeManager.__nestScope(node);

            if (this.scopeManager.__isNodejsScope()) {
                // Force strictness of GlobalScope to false when using node.js scope.
                this.currentScope().isStrict = false;
                this.scopeManager.__nestForceFunctionScope(node);
            }

            if (this.scopeManager.__isES6() && this.scopeManager.isModule()) {
                this.scopeManager.__nestModuleScope(node);
            }

            this.visitChildren(node);
            this.close(node);
        },

        Identifier: function (node) {
            this.currentScope().__referencing(node);
        },

        UpdateExpression: function (node) {
            if (isPattern(node.argument)) {
                this.currentScope().__referencing(node.argument, Reference.RW, null);
            } else {
                this.visitChildren(node);
            }
        },

        MemberExpression: function (node) {
            this.visit(node.object);
            if (node.computed) {
                this.visit(node.property);
            }
        },

        Property: function (node) {
            this.visitProperty(node);
        },

        MethodDefinition: function (node) {
            this.visitProperty(node);
        },

        BreakStatement: function () {},

        ContinueStatement: function () {},

        LabeledStatement: function (node) {
            this.visit(node.body);
        },

        ForStatement: function (node) {
            // Create ForStatement declaration.
            // NOTE: In ES6, ForStatement dynamically generates
            // per iteration environment. However, escope is
            // a static analyzer, we only generate one scope for ForStatement.
            if (node.init && node.init.type === Syntax.VariableDeclaration && node.init.kind !== 'var') {
                this.scopeManager.__nestScope(node);
            }

            this.visitChildren(node);

            this.close(node);
        },

        ClassExpression: function (node) {
            this.visitClass(node);
        },

        ClassDeclaration: function (node) {
            this.visitClass(node);
        },

        CallExpression: function (node) {
            // Check this is direct call to eval
            if (!this.scopeManager.__ignoreEval() && node.callee.type === Syntax.Identifier && node.callee.name === 'eval') {
                // NOTE: This should be `variableScope`. Since direct eval call always creates Lexical environment and
                // let / const should be enclosed into it. Only VariableDeclaration affects on the caller's environment.
                this.currentScope().variableScope.__detectEval();
            }
            this.visitChildren(node);
        },

        BlockStatement: function (node) {
            if (this.scopeManager.__isES6()) {
                this.scopeManager.__nestScope(node);
            }

            this.visitChildren(node);

            this.close(node);
        },

        ThisExpression: function () {
            this.currentScope().variableScope.__detectThis();
        },

        WithStatement: function (node) {
            this.visit(node.object);
            // Then nest scope for WithStatement.
            this.scopeManager.__nestScope(node);

            this.visit(node.body);

            this.close(node);
        },

        VariableDeclaration: function (node) {
            var variableTargetScope, i, iz, decl;
            variableTargetScope = (node.kind === 'var') ? this.currentScope().variableScope : this.currentScope();
            for (i = 0, iz = node.declarations.length; i < iz; ++i) {
                decl = node.declarations[i];
                this.visitVariableDeclaration(variableTargetScope, Variable.Variable, node, i);
                if (decl.init) {
                    this.visit(decl.init);
                }
            }
        },

        // sec 13.11.8
        SwitchStatement: function (node) {
            var i, iz;

            this.visit(node.discriminant);

            if (this.scopeManager.__isES6()) {
                this.scopeManager.__nestScope(node);
            }

            for (i = 0, iz = node.cases.length; i < iz; ++i) {
                this.visit(node.cases[i]);
            }

            this.close(node);
        },

        FunctionDeclaration: function (node) {
            this.visitFunction(node);
        },

        FunctionExpression: function (node) {
            this.visitFunction(node);
        },

        ForOfStatement: function (node) {
            this.visitForIn(node);
        },

        ForInStatement: function (node) {
            this.visitForIn(node);
        },

        ArrowFunctionExpression: function (node) {
            this.visitFunction(node);
        },

        ImportDeclaration: function (node) {
            var importer;

            assert(this.scopeManager.__isES6() && this.scopeManager.isModule());

            importer = new Importer(node, this);
            importer.visit(node);
        },

        ExportDeclaration: function (node) {
            if (node.source) {
                return;
            }
            if (node.declaration) {
                this.visit(node.declaration);
                return;
            }

            this.visitChildren(node);
        },

        ExportSpecifier: function (node) {
            this.visit(node.id);
        }
    });

    /**
     * Main interface function. Takes an Esprima syntax tree and returns the
     * analyzed scopes.
     * @function analyze
     * @param {esprima.Tree} tree
     * @param {Object} providedOptions - Options that tailor the scope analysis
     * @param {boolean} [providedOptions.optimistic=false] - the optimistic flag
     * @param {boolean} [providedOptions.directive=false]- the directive flag
     * @param {boolean} [providedOptions.nodejsScope=false]- whether the whole
     * script is executed under node.js environment. When enabled, escope adds
     * a function scope immediately following the global scope.
     * @param {boolean} [providedOptions.ignoreEval=false]- whether to check 'eval()' calls
     * @param {string} [providedOptions.sourceType='script']- the source type of the script. one of 'script' and 'module'
     * @param {number} [providedOptions.ecmaVersion=5]- which ECMAScript version is considered
     * @return {ScopeManager}
     */
    function analyze(tree, providedOptions) {
        var scopeManager, referencer, options;

        options = updateDeeply(defaultOptions(), providedOptions);

        scopeManager = new ScopeManager(options);

        referencer = new Referencer(scopeManager);
        referencer.visit(tree);

        assert(scopeManager.__currentScope === null);

        return scopeManager;
    }

    /** @name module:escope.version */
    exports.version = require('./package.json').version;
    /** @name module:escope.Reference */
    exports.Reference = Reference;
    /** @name module:escope.Variable */
    exports.Variable = Variable;
    /** @name module:escope.Scope */
    exports.Scope = Scope;
    /** @name module:escope.ScopeManager */
    exports.ScopeManager = ScopeManager;
    /** @name module:escope.analyze */
    exports.analyze = analyze;
}());
/* vim: set sw=4 ts=4 et tw=80 : */
