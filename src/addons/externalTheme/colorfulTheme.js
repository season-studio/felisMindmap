export const colorfulThemeTemplate = `
<!--template XML-->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <style eblock-predefined="" d-tag="colorful-theme">
        .season-topic-drag-group {
            --colorful-topic-base-fill-color: #F6212D;
        }

        [season-topic-global] {
            --topic-base-fill-color: var(--colorful-topic-base-fill-color) !important;
            --topic-base-line-color: var(--topic-base-fill-color) !important;
            --topic-base-font-color: #fff !important;
            --topic-line-size: 1px;
        }

        [season-topic-global][d-topic-level="0"] {
            --colorful-topic-base-fill-color: #F6212D;
            --topic-line-size: 3px;
        }

        [season-topic-global][d-topic-level="1"] {
            --topic-line-size: 2px;
        }

        [season-topic-global][d-topic-level="1"]:nth-child(7n) {
            --colorful-topic-base-fill-color: #F04137;
        }

        [season-topic-global][d-topic-level="1"]:nth-child(7n+1) {
            --colorful-topic-base-fill-color: #ff6600;
        }

        [season-topic-global][d-topic-level="1"]:nth-child(7n+2) {
            --colorful-topic-base-fill-color: #FEC938;
        }

        [season-topic-global][d-topic-level="1"]:nth-child(7n+3) {
            --colorful-topic-base-fill-color: #A0C347;
        }

        [season-topic-global][d-topic-level="1"]:nth-child(7n+4) {
            --colorful-topic-base-fill-color: #06ABD0;
        }

        [season-topic-global][d-topic-level="1"]:nth-child(7n+5) {
            --colorful-topic-base-fill-color: #832A96;
        }

        [season-topic-global][d-topic-level="1"]:nth-child(7n+6) {
            --colorful-topic-base-fill-color: #FF006E;
        }

        [season-topic-content-group][season-topic-focus] {
            --topic-border-color: var(--topic-line-color);
            --topic-border-size: 5px;
        }

        [season-topic-focus] > .season-topic-box {
            animation: colorful-focus-topic-animate 1.7s linear infinite;
            /* stroke: #ff006e;
            stroke-dasharray: calc(var(--topic-border-size) * 3) calc(var(--topic-border-size) * 2); */
        }

        @keyframes colorful-focus-topic-animate {
              0% {
                stroke-opacity: 1;
              }
              50% {
                stroke-opacity: 0.3;
              }
              100% {
                stroke-opacity: 1;
              }
            }
    </style>
    <script eblock-script="">
    <![CDATA[
        declarer.getExtensionInfo = function () {
            return {
                name: "colorful-theme"
            };
        };
    ]]>
    </script>
    <use eblock-template="" />
</svg>
`;