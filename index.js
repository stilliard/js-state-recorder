
const StateRewind = function (options) {
    let history = [],
        changeIndex = -1;

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
    const squashReducer = function (compare, startIndex) {
        return function (accumulator, currentValue, index) {
            if (startIndex) {
                index += startIndex;
            }
            let previousValue = accumulator[index - 1];
            if (index && compare(previousValue.change, currentValue.change)) {
                if (index <= changeIndex) { // adjust the change index to match the meet the new order
                    changeIndex--;
                }
                log('squashing index', index, ' from: ', previousValue, ' to:', currentValue); 
                accumulator[index - 1] = currentValue;
                return accumulator;
            }
            return accumulator.concat([currentValue]);
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
            return this;
        },

        undo() {
            if (changeIndex == -1) {
                log('nothing to undo');
                return false;
            }
            log('undo');
            if (typeof history[changeIndex].backward == 'function') {
                history[changeIndex].backward();
            }
            changeIndex--;
            return true;
        },

        redo() {
            if (changeIndex == history.length - 1) {
                log('nothing to redo');
                return false;
            }
            log('redo');
            changeIndex++;
            if (typeof history[changeIndex].forward == 'function') {
                history[changeIndex].forward();
            }
            return true;
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
        squash(compare) {
            log('squash');
            history = history.reduce(squashReducer(compare), []);
            return this;
        },

        // Rather than squashing the enitre history, you may want to selectivly run this against the latest & previous set values only
        squashLast(compare) {
            const last = history.pop();
            history = [last].reduce(squashReducer(compare, history.length), history);
            return this;
        },

    };
};
