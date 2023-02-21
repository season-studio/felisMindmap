import { darkShare } from "./darkShareTemplate";

export const darkOrangeThemeTemplate = `
<!--template XML-->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <style eblock-predefined="" d-tag="dark-orange-theme">
        ${darkShare}

        .season-topic-drag-group {
            --dark-orange-topic-base-fill-color: #FA6800;
        }

        [season-topic-global] {
            --dark-orange-topic-base-fill-color: #FA6800;
            --topic-base-fill-color: var(--dark-orange-topic-base-fill-color) !important;
            --topic-base-line-color: var(--topic-base-fill-color) !important;
            --topic-base-font-color: #aaa !important;
            --topic-line-size: 1px;
            --topic-font-color: var(--topic-base-font-color) !important;
        }

        [season-topic-global][d-topic-level="0"] {
            --topic-line-size: 3px;
        }

        [season-topic-global][d-topic-level="1"] {
            --topic-line-size: 2px;
        }

        [season-topic-content-group][season-topic-focus] {
            --topic-border-color: var(--topic-line-color);
            --topic-border-size: 5px;
            --topic-font-color: #fff !important;
        }

        [season-topic-focus] > .season-topic-box {
            animation: dark-focus-topic-animate 1.7s linear infinite;
            /* stroke: #ff006e;
            stroke-dasharray: calc(var(--topic-border-size) * 3) calc(var(--topic-border-size) * 2); */
        }

        @keyframes dark-focus-topic-animate {
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
                name: "dark-orange-theme"
            };
        };
    ]]>
    </script>
    <desc eblock-predefined="" season-topic-parameters="dark-orange-theme">
    {
        "backgroundColor": "#1E1E1E"
    }
    </desc>
    <use eblock-template="" />
</svg>
`;