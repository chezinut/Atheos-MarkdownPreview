<?php
/*
 * Copyright (c) Codiad & Andr3as, distributed
 * as-is and without warranty under the MIT License. 
 * See http://opensource.org/licenses/MIT for more information.
 * This information must remain intact.
 */

// Atheos MarkdownPreview Controller
// Copyright (c) 2026 CheziNut, distributed as-is and without warranty
// under the MIT License. See [root]/docs/LICENSE.md for more.
// This information must remain intact.

require_once(__DIR__ . "/../../common.php");

// Only process if this is an AJAX request with an action
$action = POST("action");
if (empty($action)) {
    // Direct access - return error
    http_response_code(400);
    echo json_encode(["status" => 400, "text" => "Invalid request"]);
    exit;
}

Common::checkSession();

switch($action) {

    case 'getContent':
        $path = POST("path");
        if (empty($path)) {
            Common::send(400, 'Missing parameter!');
            break;
        }

        $fullPath = getWorkspacePath($path);
        if ($fullPath === false) {
            Common::send(400, 'Invalid path');
            break;
        }

        if (!file_exists($fullPath)) {
            Common::send(404, 'File not found');
            break;
        }

        $content = file_get_contents($fullPath);
        if ($content === false) {
            Common::send(500, 'Failed to read file');
            break;
        }

        Common::send(200, ["content" => $content]);
        break;

    case 'saveContent':
        $content = POST("content");
        $path = POST("path");

        if (empty($content) || empty($path)) {
            Common::send(400, 'Missing parameter!');
            break;
        }

        $fullPath = getWorkspacePath($path);
        if ($fullPath === false) {
            Common::send(400, 'Invalid path');
            break;
        }

        $ext = getExtension($path);
        $htmlFile = dirname($fullPath) . "/" . basename($fullPath, "." . $ext) . ".html";

        $inc = 1;
        while(file_exists($htmlFile)) {
            $htmlFile = dirname($fullPath) . "/" . basename($fullPath, "." . $ext) . "($inc).html";
            $inc++;
        }

        $template = file_get_contents(__DIR__ . "/template.html");
        if ($template === false) {
            Common::send(500, 'Failed to load template');
            break;
        }

        $htmlContent = str_replace("__CONTENT__", $content, $template);
        $result = file_put_contents($htmlFile, $htmlContent);

        if ($result === false) {
            Common::send(500, 'Failed to save content');
        } else {
            Common::send(200, 'Content saved');
        }
        break;

    default:
        Common::send(416, 'Invalid action');
        break;
}

function getExtension($path) {
    $name = basename($path);
    $pos = strrpos($name, '.');
    if ($pos !== false) {
        return substr($name, $pos + 1);
    }
    return "";
}

function getWorkspacePath($path) {
	//Security check
	if (!Common::checkPath($path)) {
		return false;
	}
	if (strpos($path, "/") === 0) {
		//Unix absolute path
		return $path;
	}
	if (strpos($path, ":/") !== false) {
		//Windows absolute path
		return $path;
	}
	if (strpos($path, ":\\") !== false) {
		//Windows absolute path
		return $path;
	}
	return "../../workspace/".$path;
}
?>