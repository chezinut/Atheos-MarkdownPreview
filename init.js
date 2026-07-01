//////////////////////////////////////////////////////////////////////////////80
// Atheos MarkdownPreview
//////////////////////////////////////////////////////////////////////////////80
// Copyright (c) 2026 CheziNut, distributed as-is and without warranty
// under the MIT License. See [root]/docs/LICENSE.md for more.
// This information must remain intact.
//////////////////////////////////////////////////////////////////////////////80
// Copyright (c) Codiad & Andr3as
// Source: https://github.com/Andr3as/Codiad-MarkdownPreview
//////////////////////////////////////////////////////////////////////////////80

(function() {
	'use strict';

	const self = {

		path: (typeof atheos.path === 'string' ? atheos.path : '') + 'plugins/MarkdownPreview/',
		cssText: null,
		mdReady: false,

		init: function() {
			self.loadMarkdownLib();
			self.loadCSS();
			self.bindContextMenu();
			self.bindKeyboardShortcuts();
		},

		loadMarkdownLib: function() {
			if (typeof window.markdown === 'undefined') {
				atheos.common.loadScript(this.path + 'markdown.js', function() {
					self.mdReady = true;
				});
			} else {
				self.mdReady = true;
			}
		},

		loadCSS: function() {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', this.path + 'markdown.css', true);
			xhr.onreadystatechange = function() {
				if (xhr.readyState === 4 && xhr.status === 200) {
					self.cssText = xhr.responseText;
				}
			};
			xhr.send();
		},

		bindContextMenu: function() {
			carbon.subscribe('contextmenu.showFileTreeMenu', function(active) {
				if (!active || !active.path) return;
				if (active.type === 'folder') return;

				var ext = active.extension;
				var isMd = ext === 'md' || ext === 'markdown';
				var isHtml = ext === 'html' || ext === 'htm';
				var isSvg = ext === 'svg';
				if (!isMd && !isHtml && !isSvg) return;

				self.cleanupContextMenu();

				var menu = oX('#contextmenu');
				menu.append('<hr class="preview-separator">');
				menu.append('<a class="preview-item" action="atheos.MarkdownPreview.showPreview"><i class="fas fa-eye"></i> Preview</a>');
				if (isMd) {
					menu.append('<a class="preview-item" action="atheos.MarkdownPreview.generate"><i class="fas fa-file-code"></i> Generate HTML</a>');
				}
			});
		},

		cleanupContextMenu: function() {
			var items = document.querySelectorAll('.preview-separator, .preview-item');
			items.forEach(function(item) { item.remove(); });
		},

		bindKeyboardShortcuts: function() {
			carbon.subscribe('active.focus', function(path) {
				if (!path) return;
				var ext = self.getExtension(path);
				var isMd = ext === 'md' || ext === 'markdown';
				var isHtml = ext === 'html' || ext === 'htm';
				var isSvg = ext === 'svg';
				if (!isMd && !isHtml && !isSvg) return;

				var editor = atheos.inFocusEditor;
				if (!editor || !editor.commands) return;

				editor.commands.addCommand({
					name: 'MarkdownPreview',
					bindKey: { win: 'Ctrl-Shift-P', mac: 'Command-Shift-P' },
					exec: function() {
						self.showPreview(atheos.inFocusPath);
					},
					multiSelectAction: 'forEach',
					readOnly: false
				});
			});
		},

		fetchContent: function(path, callback) {
			echo({
				url: atheos.controller,
				data: {
					target: 'MarkdownPreview',
					action: 'getContent',
					path: path
				},
				settled: function(reply, status) {
					if (status === 200 && reply && reply.content) {
						callback(reply.content);
					} else {
						atheos.toast.show('error', 'Failed to read file');
					}
				}
			});
		},

		showPreview: function(active) {
			try {
				var path = active && active.path ? active.path : active;
				if (!path) return;

				var ext = self.getExtension(path);
				var isMd = ext === 'md' || ext === 'markdown';
				var isHtml = ext === 'html' || ext === 'htm';
				var isSvg = ext === 'svg';
				if (!isMd && !isHtml && !isSvg) return;

				self.fetchContent(path, function(content) {
					var previewHtml;
					if (isMd) {
						if (!self.mdReady || typeof window.markdown === 'undefined') {
							atheos.toast.show('error', 'Markdown library not loaded. Please try again.');
							return;
						}
						var rendered = markdown.toHTML(content, 'Maruku');
						previewHtml = self.buildPreview(path, rendered);
					} else {
						previewHtml = content;
					}

					var blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' });
					var url = URL.createObjectURL(blob);
					var win = window.open(url, '_blank');
					if (!win) {
						URL.revokeObjectURL(url);
						atheos.toast.show('error', 'Popup blocked. Please allow popups for this site.');
						return;
					}
					setTimeout(function() { URL.revokeObjectURL(url); }, 10000);
				});
			} catch (e) {
				console.error('MarkdownPreview error:', e);
				atheos.toast.show('error', 'Preview failed: ' + e.message);
			}
		},

		generate: function(active) {
			try {
				var path = active && active.path ? active.path : active;
				if (!path) return;

				var ext = self.getExtension(path);
				if (ext !== 'md' && ext !== 'markdown') return;

				if (!self.mdReady || typeof window.markdown === 'undefined') {
					atheos.toast.show('error', 'Markdown library not loaded. Please try again.');
					return;
				}

				self.fetchContent(path, function(content) {
					var html = markdown.toHTML(content, 'Maruku');
					var fullHtml = self.buildPreview(path, html);
					var basePath = path.replace(/\\/g, '/').replace(/\/[^\/]*\/?$/, '');

					echo({
						url: atheos.controller,
						data: {
							target: 'MarkdownPreview',
							action: 'saveContent',
							path: path,
							content: fullHtml
						},
						settled: function(reply, status) {
							if (status === 200) {
								atheos.toast.show('success', 'HTML generated successfully');
								if (basePath) atheos.filetree.rescan(basePath);

								// Open the generated HTML in a new tab
								var blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
								var blobUrl = URL.createObjectURL(blob);
								var win = window.open(blobUrl, '_blank');
								if (win) {
									setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 10000);
								}
					} else if (isSvg) {
						previewHtml = '<!DOCTYPE html>\n<html><head><meta charset="UTF-8"><title>' +
							self.escapeHTML(path.split('/').pop()) +
							'</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;}svg{max-width:95vw;max-height:95vh;}</style></head><body>' +
							content + '</body></html>';
					} else {
								atheos.toast.show('error', 'Failed to generate HTML');
							}
						}
					});
				});
			} catch (e) {
				console.error('MarkdownPreview error:', e);
				atheos.toast.show('error', 'Generate failed: ' + e.message);
			}
		},

		buildPreview: function(path, renderedHtml) {
			var title = path.split('/').pop();
			var css = self.cssText || '';
			return '<!DOCTYPE html>\n' +
				'<html lang="en">\n' +
				'<head>\n' +
				'    <meta charset="UTF-8">\n' +
				'    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
				'    <title>' + self.escapeHTML(title) + '</title>\n' +
				'    <style>\n' + css + '\n    </style>\n' +
				'    <style>body{max-width:50em;margin:10px auto;padding:1em;}</style>\n' +
				'</head>\n' +
				'<body>\n' + renderedHtml + '\n</body>\n' +
				'</html>';
		},

		getExtension: function(path) {
			if (!path) return '';
			var dot = path.lastIndexOf('.');
			return dot > -1 ? path.substring(dot + 1).toLowerCase() : '';
		},

		escapeHTML: function(text) {
			var d = document.createElement('div');
			d.textContent = text || '';
			return d.innerHTML;
		}
	};

	carbon.subscribe('system.loadExtra', () => self.init());
	atheos.MarkdownPreview = self;

})();
