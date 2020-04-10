import {Notification} from "./notification";

class Caller {
    constructor(context, controllSpinner) {
        this.context = context;
        this.controllSpinner = controllSpinner;
    }

    execute(context, method, params) {
        //Fire spinner
        if (this.controllSpinner == true) {
            context.spinner = true;
        }

        return new Promise((resolve, reject) => {
            method(params).then(result => {
                if (result.enableDebugLogInMessage) {
                    console.debug('##', result);
                }

                if (result.success) {
                    resolve(result);
                } else {
                    reject(result.message);
                }
            }).catch(reason => {
                new Notification().toast(context, '', reason, 'error');
            }).finally(() => {
                //Turn loader off
                if (this.controllSpinner == true) {
                    context.spinner = false;
                }
            })
        });
    }
}

export {Caller}