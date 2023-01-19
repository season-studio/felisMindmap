import dialog from "../../thirdpart/toolkits/src/tip/dialog";

export default function showWaitDialog(_text) {
    const dlg = new dialog(`<!--template XML-->
        <style>
            .loading {
                height: 40px;
                display: flex;
                align-items: center;
            }
            .loading-item {
                height: 50px;
                width: 5px;
                background: #F4942B;
                margin: 0px 3px;
                border-radius: 10px;
                animation: loading 1s infinite;
                filter: drop-shadow(0px 0px 6px #eee);
            }
            @keyframes loading {
                0% {
                    height: 0px;
                }
                50% {
                    height: 50px;
                }
                100% {
                    height: 0px;
                }
            }
            .loading-item:nth-child(1) {
                background: #F17F0A;
            }
            .loading-item:nth-child(2) {
                animation-delay: 0.1s;
                background: #F18317;
            }
            .loading-item:nth-child(3) {
                animation-delay: 0.2s;
            }
            .loading-item:nth-child(4) {
                animation-delay: 0.3s;
            }
            .loading-item:nth-child(5) {
                animation-delay: 0.4s;
                background: #F59F39;
            }
            .loading-item:nth-child(6) {
                animation-delay: 0.5s;
                background: #F5B913;
            }
            .loading-item:nth-child(7) {
                animation-delay: 0.6s;
                background: #F59F39;
            }
            .loading-item:nth-child(8) {
                animation-delay: 0.7s;
            }
            .loading-tip {
                max-width: 75%;
                margin-top: 1em;
                padding: 0.5em !important;
                font-weight: lighter;
                font-size: 0.9em;
            }
        </style>
        <div class="loading">
            <div class="loading-item"></div>
            <div class="loading-item"></div>
            <div class="loading-item"></div>
            <div class="loading-item"></div>
            <div class="loading-item"></div>
            <div class="loading-item"></div>
            <div class="loading-item"></div>
            <div class="loading-item"></div>
        </div>
        <div class="loading-tip"></div>
        `, {
            // fadeOutTime: 0,
            onInitialize(_self) {
                _self.root.style.backdropFilter = "blur(6px)";
                const tipNode = _self.root.querySelector(".loading-tip");
                Object.defineProperties(_self, {
                    tip: {
                        get: () => (tipNode ? tipNode.textContent : ""),
                        set: (_val) => (tipNode && (tipNode.innerHTML = "", tipNode.insertAdjacentHTML("beforeend", String(_val || "").replaceAll("\n", "<br />").replaceAll(/\s/ig, "&nbsp;")))),
                        configurable: false,
                        enumerable: true
                    }
                });
                _self.tip = _text;
            }
        });
    dlg.show();
    return dlg;
}