
const StateRewind = function (options) {
    let history = [],
        changeIndex = -1,
        onChangeCallback;

    // default options
    options = Object.assign({
        log: false
    }, options || {});

    // super simple logging
    const log = function log(...data) {
        if (options.log) {
            console.info('%c[state]', 'color: limegreen; font-weight: bold;', ...data);
        }
    };

    // we expose functions later to squash state history down based on a defined comparison function
    // this is done by reducing the data to non matching, and having only the latest matching value be found
    const squashReducer = function (compare, modify, startIndex) {
        return function (accumulator, currentValue, index) {
            if (typeof startIndex != "undefined") {
                index += startIndex;
            }
            let previousValue = accumulator[index - 1];
            if (index && compare(previousValue.change, currentValue.change)) {
                if (index <= changeIndex) { // adjust the change index to match the meet the new order
                    changeIndex--;
                }
                if (typeof modify == 'function') {
                    currentValue.change = modify(previousValue.change, currentValue.change);
                }
                log('squashing index', index, ' from: ', previousValue, ' to:', currentValue); 
                accumulator[index - 1] = currentValue;
                startIndex = (startIndex || 0) - 1;
                return accumulator;
            }
            return accumulator.concat([currentValue]);
        }
    };

    // runs any provided callback after any state change (set,exec,undo,redo)
    const onChangeHandler = function () {
        if (typeof onChangeCallback == 'function') {
            onChangeCallback();
        }
    };

    // public methods
    return {

        // Execute the forward function and set state at once
        exec(change, forward, backward) {
            this.set(change, forward, backward);
            log('exec');
            forward();
            return this;
        },

        set(change, forward, backward) {
            log('set');
            history.length = changeIndex + 1; // reset the length each time to wipe any redo history
            history.push({change, forward, backward});
            changeIndex++;
            onChangeHandler();
            return this;
        },

        canUndo() {
            return changeIndex != -1;
        },
        undo() {
            if (! this.canUndo()) {
                log('nothing to undo');
                return this;
            }
            log('undo');
            if (typeof history[changeIndex].backward == 'function') {
                history[changeIndex].backward();
            }
            changeIndex--;
            onChangeHandler();
            return this;
        },

        canRedo() {
            return changeIndex != history.length - 1;
        },
        redo() {
            if (! this.canRedo()) {
                log('nothing to redo');
                return this;
            }
            log('redo');
            changeIndex++;
            if (typeof history[changeIndex].forward == 'function') {
                history[changeIndex].forward();
            }
            onChangeHandler();
            return this;
        },

        get() {
            if (changeIndex == -1) {
                log('no changes');
                return;
            }
            return history[changeIndex].change;
        },

        getAll() {
            if (changeIndex == -1) {
                log('no changes');
                return;
            }
            return history.slice(0, changeIndex + 1).map(_ => _.change); // slice to ignore redos
        },

        // You may want to squash down the history based on a comparison callback, allowing you to filter out repeated similar changes
        squash(compare, modify) {
            log('squash');
            history = history.reduce(squashReducer(compare, modify), []);
            onChangeHandler();
            return this;
        },

        // Rather than squashing the enitre history, you may want to selectivly run this against the latest & previous set values only
        squashLast(compare, modify) {
            const last = history.pop();
            history = [last].reduce(squashReducer(compare, modify, history.length), history);
            onChangeHandler();
            return this;
        },

        // setup an on change handler callback
        onChange(callback) {
            onChangeCallback = callback;
        },

    };
};

// expose to nodejs enviroment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StateRewind;
}
