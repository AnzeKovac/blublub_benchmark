const express = require('express');
const documentsAPI = require("./documents");
const resHandler = require('./responseHandler');
const logger = require('../../helpers/logger');
const auth = require('../auth/auth')

let app = module.exports = express()

//Defines executive sumamry template file id
const EXECUTIVE_SUMMARY_TEMPLATE_ID = ["hjk43h5k3j45hkj7656565j54j55j5j555"];

app.post("/compile/:documentType", function (req, res) {
    const templates = req.body.templates;
    const contractData = req.body.contractData;
    const documentType = req.params.documentType

    auth.getAccessToken().then((authResponse) => {
        const token = authResponse.data.access_token;
        const functionName = "merge"
        const parameters = [
            templates,
            JSON.stringify(contractData)
        ]
        compileTemplate(token, functionName, parameters, documentType, res);

    }).catch((error) => {
        resHandler.handleAuthFailed(res, error);
    });
});

//document export and upload to target destination
app.get("/:documentId/export/", function (req, res) {
    const documentId = req.params.documentId
    const sessionId = req.query.session
    const instanceUrl = req.query.instance

    auth.getAccessToken().then((authResponse) => {
        const token = authResponse.data.access_token;
        return documentsAPI.downloadFile(token, documentId)
    }).then((fileResponse) => {
        logger.log('info', 'File downloaded from Document API', { documentId: documentId })
        let pdf = new Buffer.from(fileResponse.data, "binary").toString("base64");

        //upload to target and return created id
        return targetDestionation.uploadFile(sessionId, instanceUrl, pdf, 'documentType')
    }).then((versionId) => {
        logger.log('info', 'Uploaded version ', { versionId: versionId })
        res.send({
            status: true,
            message: "Document exported and uploaded to target destination",
            exportDetail: {
                versionId: versionId,
            }
        })
    }).catch((error) => {
        logger.log('error', 'Document export failed', error)
        res.send({
            status: false,
            message: "Document export failed => " + error,
        })
    });
});

//shares queue creation
app.post("/setShares", function (req, res) {
    const shares = req.body.shares

    auth.getAccessToken().then((authResponse) => {
        logger.log('info', 'Shares request received to process', { data: shares })
        const token = authResponse.data.access_token;

        for (const share of shares) {
            documentAPI.setShares(token, share.documentId, share.shareDetails, res)
        }
    }).catch((error) => {
        resHandler.handleAuthFailed(res, error);
    });
});

//queue status check
app.get("/shares/status", function (req, res) {
    res.send(documentAPI.getQueueStatus())
});

//updates merge tags placeholders
app.post('/:docId/update', (req, res) => {
    const documentId = req.params.docId
    const data = req.body.data

    auth.getAccessToken().then((authResponse) => {
        const token = authResponse.data.access_token;
        const functionName = "updateDocument"
        const parameters = [
            documentId,
            JSON.stringify(data.update)
        ]
        return documentsAPI.runFunction(token, functionName, parameters)
    }).then((mergeResponse) => {
        if ("error" in mergeResponse.data) {
            logger.log('error', 'Document update failed', mergeResponse.data)
            res.send({
                status: false,
                message: JSON.stringify(mergeResponse.data.error)
            })
        } else {
            logger.log('info', 'Document update', { documentId: documentId })
            res.send({
                status: true,
                message: "Document updated",
                draftDetail: {
                    documentId: documentId,

                }
            });
        }
    }).catch((error) => {
        resHandler.handleAuthFailed(res, error);
    });
});

//finishes up the document, removes merge fields
app.post('/:docId/finish', (req, res) => {
    const documentId = req.params.docId

    auth.getAccessToken().then((authResponse) => {
        const token = authResponse.data.access_token;
        const functionName = "finishDocument"
        const parameters = [
            documentId
        ]
        return documentsAPI.runFunction(token, functionName, parameters)
    }).then((mergeResponse) => {
        if ("error" in mergeResponse.data) {
            logger.log('error', 'Document finish error', mergeResponse.data)
            res.send({
                status: false,
                message: JSON.stringify(mergeResponse.data.error)
            })
        } else {
            logger.log('info', 'Document finished', { documentId: documentId })
            res.send({
                status: true,
                message: "Document finished"
            });
        }
    }).catch((error) => {
        resHandler.handleAuthFailed(res, error);
    });
});


//runs provided cloud function with
function compileTemplate(token, functionName, parameters, documentType, res) {
    documentsAPI.runCloudFunction(token, functionName, parameters).then((mergeResponse) => {
        if ('error' in mergeResponse.data) {
            logger.log('error', documentType + ' compile failed', mergeResponse.data)
            res.send({
                status: false,
                message: JSON.stringify(mergeResponse.data.error)
            })
        } else {
            const mergeResponse = JSON.parse(mergeResponse.data.response.result)
            logger.log('info', documentType + ' compile successful', { documentId: mergeResponse.documentId })
            res.send({
                status: true,
                message: 'Document ' + documentType + ' compiled',
                documentDetail: {
                    documenetId: mergeResponse.documentId,
                    folderId: mergeResponse.contractFolderId
                }
            });
        }
    }).catch((error) => {
        resHandler.handleDocumentCompileFailed(res, 'Summary', error);
    });
}

