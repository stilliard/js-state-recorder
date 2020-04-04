
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

    };
};
