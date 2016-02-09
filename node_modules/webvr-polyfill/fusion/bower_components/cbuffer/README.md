## JavaScript [Circular Buffer](http://en.wikipedia.org/wiki/Circular_buffer) Utility

The end goal of this project is to implement the entire JavaScript `Array.prototype`, and some
additional utility methods, as a circular buffer.

Note: This is called a circular buffer because of what this library accomplishes, but is implemented
as an Array. This may be confusing for Node users, which may want to use a true Buffer.

While the entire `Array.prototype` API is on the roadmap, it's not all quite here. Below is the
currently implemented API.


### Usage

It's simple. Just use it like you would use an Array.

```javascript
new CBuffer(10);      // empty buffer with length of 10
new CBuffer(1,2,3,4); // buffer with length 4
CBuffer(5);           // For those who are really lazy, new is optional
```

Included are several non-standard niceties. Like if you want to catch when data is overwritten,
just assign a function to the `overflow` variable and it will be called whenever a value is about
to be overwritten and it will pass the value as the first argument:

```javascript
var myBuff = CBuffer(4);
myBuff.overflow = function(data) {
    console.log(data);
};

myBuff.push(1,2,3,4); // nothing shows up yet
myBuff.push(5);       // log: 1
```


### API

#### Mutator Methods

* pop         - Removes the last element from a circular buffer and returns that element.
* push        - Adds one or more elements to the end of a circular buffer and returns the new size.
* reverse     - Reverses the order of the elements of a circular buffer.
* rotateLeft  - Rotates all elements left 1, or n, times.
* rotateRight - Rotates all elements right 1, or n, times.
* shift       - Removes the first element from a circular buffer and returns that element.
* sort        - Sorts the elements of a circular buffer. Unlike native `sort`, the default comparitor sorts by `a > b`.
* unshift     - Adds one or more elements to the front of a circular buffer and returns the new size.

#### Accessor Methods

* indexOf     - Returns the first (least) index of an element within the circular buffer equal to the specified value, or -1 if none is found.
* lastIndexOf - Returns the last (greatest) index of an element within the circular buffer equal to the specified value, or -1 if none is found.
* sortedIndex - Returns the position some `value` would be inserted into a sorted circular buffer ranked by an optional comparitor.

#### Iteration Methods

* every       - Returns true if every element in the circular buffer satisfies the provided testing function.
* forEach     - Calls a function for each element in the circular buffer.
* some        - Returns true if at least one element in the circular buffer satisfies the provided testing function.

#### Utility Methods

* empty       - Equivalent to setting `Array.length = 0`.
* fill        - Fill with passed argument. Also supports functions.
* first       - Returns first value in circular buffer.
* last        - Returns last value in circular buffer.
* get         - Get value at specific index.
* set         - Set value as specific index.
* toArray     - Return clean ordered array of buffer.
* overflow    - Set to function and will be called when data is about to be overwritten.
* slice       - Return a slice of the buffer as an array.
