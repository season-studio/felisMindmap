import AppWorker from "./client/appWorker";
import { initViewer } from "./client/viewMain";
import showWaitDialog from "./client/waitDlg";

function initApp() {
    let startWaitDlg = showWaitDialog("Loading...");
    AppWorker.start("./sw.js")
    .catch(function(error) {
        console.error("$[Service worker registration failed]", error);
    })
    .finally(async function () {
        await initViewer(startWaitDlg);
        startWaitDlg.close();
    });
}

document.addEventListener("readystatechange", function() {
    (document.readyState === "complete") && initApp();
});

export default initApp;
