const axios = require('axios');
const cfg = require('../../config');
const logger = require('../../helpers/logger')
const Queue = require('../../helpers/queue')

credentials = cfg.getCredentials();

let docsSharesQueue = new Queue(10);
docsSharesQueue.onError = function(failedRequest){
    logger.log('error','Creating share for person',failedRequest);
}
docsSharesQueue.onFinish = function(executeRequests){
    logger.log('info','Creating shares for document',docsSharesQueue.statusFull());
}


function runFunction(token, functionName, params) {
    const script_id = credentials.script_id;
    const endpoint = `https://dummy.scriptexecutor.com/v1/scripts/${script_id}:run`
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    //add environment type to function execution
    params.push(process.env.NODE_ENV || 'development')

    return axios.post(
        endpoint,
        {
            "function": functionName,
            "parameters": params
        },
        config
    )
}

function downloadFile(token, documentId) {
    const endpoint = `https://dummy.documentAPI.com/document/d/${documentId}/export?format=pdf`;
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        responseType: 'arraybuffer'
    };
    return axios.get(
        endpoint,
        config
    )
}

function getQueueStatus(){
    return {
        numeric:docsSharesQueue.statusNumeric(),
        full:docsSharesQueue.statusFull()
    }
}

async function setShares(token, fileId, shares,res) {
    const endpoint = `https://www.sharesAPI.com/api/v3/docs/${fileId}/permissions?sendNotificationEmail=false`;
    const config = {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        responseType: 'application/json'
    };
    let shareRequests = []
    for (const share of shares){
        if(share.emailAddress){
            shareRequests.push(
                {
                    "endpoint": endpoint,
                    "role": share.role,
                    "type": share.type,
                    "emailAddress": share.emailAddress,
                    "config": config,
                    "priority": share.priority
                }
            )
        }
    }

    docsSharesQueue.onError = function(failedRequest){
        logger.log('error','Creating share failed for person',failedRequest);
        res.send({
            status:false,
            message: "Shares failed to created"
        })
    }
    docsSharesQueue.onFinish = function(executeRequests){
        logger.log('info',`Creating shares for ${fileId} finished`,docsSharesQueue.statusFull());
        res.send({
            status:true,
            message: "Shares created"
        })
    }
    docsSharesQueue.setRequests(shareRequests);
}

docsSharesQueue.onProcess = function(key,request){
    axios.post(
        request.data.endpoint,
        {
            "role": request.data.role,
            "type": request.data.type,
            "emailAddress": request.data.emailAddress
        },
        request.data.config
    ).then(function (response) {
        docsSharesQueue.markExecuted(key);
    }).catch(function (error) {
        if(error && error.response){
            request.error = error.response.data;
            docsSharesQueue.markFailed(key);
        }else{
            request.error = `Creating shares error for: ${job.data.emailAddress} on document ${job.data.jobId}` 
            docsSharesQueue.markFailed(key);
        }
    })
}

module.exports = {
    runFunction,
    downloadFile,
    setShares,
    getQueueStatus
}