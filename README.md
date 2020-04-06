# JS StateRewind [![Build Status](https://travis-ci.org/stilliard/js-state-rewind.svg?branch=master)](https://travis-ci.org/stilliard/js-state-rewind)

Simple state management with the ability to undo, redo & squash history.

Want to skip to a full working example? https://jsfiddle.net/4a9dup0w/48

-----------------------

## Install

```sh
npm install state-rewind
```

## Usage

Init a state object
```js
const state = new StateRewind;
```
init with console logs for debug
```js
const state = new StateRewind({ log: true });
```

Set the state
```js
state.set(5);
```
or `exec` to run/execute a function at the same time that can later be undone or redone
```js
state.exec(5, function () { console.log('foward'); }, function () { console.log('backward'); });
```

State can be anything, strings, numbers, arrays, objects, anything, e.g. (works with `set` & `exec`)
```js
state.set({
    x: "test",
    y: [1, 2, 3]
});
```

Get the current state
```js
state.get();
```

Undo/rewind state change
```js
state.undo();
```

& then redo/fast-forward current state
```js
state.redo();
```

You can also check if undo or redo are available with:
```js
state.canUndo(); // boolean
state.canRedo(); // boolean
```

Get all recorded state changes
```js
state.getAll();
```

### Callbacks

Optionally listen in for changes to the state:
```js
state.onChange(function () { ... });
```

Each set/exec can pass a forward and backward callback e.g. to handle the changes visually etc.

You can also set a default function that's given a direction of either forward or backward and the change where you can instruct how it should handle this.
e.g.
```js
state.setDefaultForwardBackwardCallback(function (direction, change) {
    if (direction == 'forward') {
        // do/redo it (e.g. on exec() or redo() or initial load() calls)
    } else if (direction == 'backward') {
        // undo it (e.g. on undo() calls)
    }
});
```


### Editing history

Squash history, e.g. to remove duplicates or squash down similar objects such as changes to text, if the same elements text changes multiple times you might want to squash that down to just the latest change
```js
state.squash(function (prev, next) {
    return prev == next;
});
// or for an object
state.squash(function (prev, next) {
    return prev.selector == next.selector && prev.type == next.type;
});
```
or just run squash against the last set value
```js
state.squashLast(function (prev, next) {
    // same compare function as above
    return prev == next;
});
```
The squash functions can both also take a 2nd callback to modify the data as it squashes down,
e.g. if these are text changes to the same thing, you'd probably want the original "from text", but the latest "to text".
```js
state.squashLast(function (prev, next) {
    return prev.selector == next.selector && prev.type == next.type;
}, function (prev, next) {
    next.change.from = prev.change.from; // keep the initial "from text" as we squash down to the latest "to text"
    return next;
});
```

Remove specific entries from the history.
```js
state.removeIndex(2); // index => starting at 0
```

Clear/reset all history.
```js
state.clear();
```

### Starting from stored data

You can load in initial data with the load() command:
```js
state.load(data);
```

This can be used in combination with setDefaultForwardBackwardCallback to have it auto run the callbacks such as visually changing the page to adapt to the loaded history.

```js
state.setDefaultForwardBackwardCallback(function (direction, change) { ... });

state.load([{ text: "x" }, { text: "y" }], { exec: true });
```


-----------------------

### Tips

#### Keyboard shortcuts

You may want to setup keyboard shortcuts for undo & redo.

This could be done like so, for ctrl+z (undo) & ctrl+y (redo)
```js
document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey) { // support either ctrl (win & linux) or cmd (mac)
        if (e.key == 'y' || (e.key == 'Z' && e.shiftKey)) {
            state.redo();
        } else if (e.key == 'z') {
            state.undo();
        }
    }
});
```

#### Debounce

Depending on how you're saving data, if it's user based such as on input, you may want to use this with a debounce function to not save constantly, [find out more here](https://davidwalsh.name/javascript-debounce-function) or here's a package for [debounce on npm](https://www.npmjs.com/package/debounce).

#### Chaining

Almost all functions are chainable (except get, getAll, canUndo and canRedo).

E.g.
```js
state.set(3).set(5).undo().get()
```

#### Change events

You may want to hook into the change event of the state, we expose a onChange() function for this.

This is especially useful for setting up undo and redo buttons, e.g.
```html
<button id="undo-btn" disabled>Undo</button>
<button id="redo-btn" disabled>Redo</button>
```
```js
let $undoBtn = document.querySelector('#undo-btn');
let $redoBtn = document.querySelector('#redo-btn');
state.onChange(function () {
    $undoBtn.disabled = ! state.canUndo();
    $redoBtn.disabled = ! state.canRedo();
});
$undoBtn.addEventListener('click', function (e) {
    e.preventDefault();
    state.undo();
});
$redoBtn.addEventListener('click', function (e) {
    e.preventDefault();
    state.redo();
});
```

-----------------------

### Example workflow

E.g. here's an example where you could track changes to elements on a page with timestamps:

```js
const state = new StateRewind;

// first change
state.exec({
    timestamp: (new Date).toISOString(),
    selector: '#el span',
    type: 'text',
    change: {
        from: 'ABC',
        to: 'XYZ'
    }
}, function () { console.log('A'); }, function () { console.log('B'); });

// another change
state.exec({
    timestamp: (new Date).toISOString(),
    selector: '.another strong',
    type: 'text',
    change: {
        from: 'Hello world',
        to: 'one thing'
    }
}, function () { console.log('C'); }, function () { console.log('D'); });

state.undo();

state.redo();

state.exec({
    timestamp: (new Date).toISOString(),
    selector: '.another strong',
    type: 'text',
    change: {
        from: 'one thing',
        to: 'Something else!'
    }
}, function () { console.log('E'); }, function () { console.log('F'); });

state.squashLast(function (prev, next) {
    return prev.selector == next.selector && prev.type == next.type;
});

state.getAll(); // should only show first and last due to the `squashLast` replacing the last 2
```

-----------------------

## Local development

### Run tests

```sh
npm test
```
