# JS StateRewind

Simple state management with the ability to undo, redo & squash history.

## Install

```
npm install state-rewind
```

## Usage

Init a state object
```
const state = new StateRewind;
```
init with console logs for debug
```
const state = new StateRewind({ log: true });
```

Set the state
```
state.set(5);
```
or `exec` to run/execute a function at the same time that can later be undone or redone
```
state.exec(5, function () { console.log('foward'); }, function () { console.log('backward'); });
```

State can be anything, strings, numbers, arrays, objects, anything, e.g. (works with `set` & `exec`)
```
state.set({
    x: "test",
    y: [1, 2, 3]
});
```

Get the current state
```
state.get();
```

Undo/rewind state change
```
state.undo();
```

& then redo/fast-forward current state
```
state.redo();
```

Get all recorded state changes
```
state.getAll();
```

Squash history, e.g. to remove duplicates or squash down similar objects such as changes to text, if the same elements text changes multiple times you might want to squash that down to just the latest change
```
state.squash(function (prev, next) {
    return prev == next;
});
// or for an object
state.squash(function (prev, next) {
    return prev.selector == next.selector && prev.type == next.type;
});
```
or just run squash against the last set value
```
state.squashLast(function (prev, next) {
    // same compare function as above
    return prev == next;
});
```

-----------------------

### Example workflow

E.g. here's an example where you could track changes to elements on a page with timestamps:

```
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
