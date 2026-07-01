<!--
    Copyright (c) Codiad & Andr3as, distributed
    as-is and without warranty under the MIT License. 
    See http://opensource.org/licenses/MIT for more information. 
	This information must remain intact.

    Atheos MarkdownPreview Dialog
    Copyright (c) 2026 CheziNut, distributed as-is and without warranty under the MIT License. 
    See http://opensource.org/licenses/MIT for more information. 
    This information must remain intact.
-->
<form id="previewForm">
    <p>Choose method to parse file:</p>
    <div style="margin: 10px 0;">
        <button type="button" onclick="atheos.MarkdownPreview.parse('js'); atheos.modal.unload(); return false;">Markdown.js</button>
        <button type="button" onclick="atheos.modal.unload(); return false;">Close</button>
    </div>
</form>