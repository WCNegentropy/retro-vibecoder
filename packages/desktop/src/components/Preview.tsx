import { useState, useMemo } from 'react';

/**
 * Preview System Component
 *
 * Displays generated files in a tree structure with:
 * - Collapsible file tree
 * - Syntax highlighting (basic)
 * - File content preview
 */

interface PreviewProps {
  files: Record<string, string>;
  title?: string;
  /** Files added during Pass 2 enrichment (shown with green indicator) */
  filesAdded?: string[];
  /** Files modified during Pass 2 enrichment (shown with yellow indicator) */
  filesModified?: string[];
}

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
  content?: string;
}

/**
 * Build a tree structure from flat file paths
 */
function buildFileTree(files: Record<string, string>): TreeNode[] {
  const root: TreeNode[] = [];

  for (const [path, content] of Object.entries(files)) {
    const parts = path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join('/');

      let node = current.find(n => n.name === part);

      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
          content: isFile ? content : undefined,
        };
        current.push(node);
      }

      if (!isFile && node.children) {
        current = node.children;
      }
    }
  }

  // Sort folders first, then files
  const sortNodes = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === 'folder' ? -1 : 1;
      })
      .map(node => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined,
      }));
  };

  return sortNodes(root);
}

/**
 * Get file extension for syntax highlighting
 */
function getFileLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    md: 'markdown',
    yml: 'yaml',
    yaml: 'yaml',
    toml: 'toml',
    rs: 'rust',
    py: 'python',
    go: 'go',
    java: 'java',
    cs: 'csharp',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    css: 'css',
    scss: 'scss',
    html: 'html',
    sh: 'bash',
    dockerfile: 'dockerfile',
  };
  return langMap[ext] || 'text';
}

/**
 * Main Preview component
 */
function Preview({ files, title = 'Generated Files', filesAdded = [], filesModified = [] }: PreviewProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildFileTree(files), [files]);
  const addedSet = useMemo(() => new Set(filesAdded), [filesAdded]);
  const modifiedSet = useMemo(() => new Set(filesModified), [filesModified]);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const fileCount = Object.keys(files).length;
  const selectedContent = selectedFile ? files[selectedFile] : null;

  return (
    <div className="preview-container">
      <div className="preview-header">
        <h3>{title}</h3>
        <span className="file-count">
          {fileCount} file{fileCount !== 1 ? 's' : ''}
          {filesAdded.length > 0 && (
            <span style={{ color: '#22c55e', marginLeft: '8px' }}>
              +{filesAdded.length} enriched
            </span>
          )}
          {filesModified.length > 0 && (
            <span style={{ color: '#eab308', marginLeft: '8px' }}>
              ~{filesModified.length} modified
            </span>
          )}
        </span>
      </div>

      <div className="preview-layout">
        <div className="file-tree-panel">
          <FileTreeView
            nodes={tree}
            expandedFolders={expandedFolders}
            selectedFile={selectedFile}
            onToggleFolder={toggleFolder}
            onSelectFile={setSelectedFile}
            filesAdded={addedSet}
            filesModified={modifiedSet}
          />
        </div>

        <div className="file-content-panel">
          {selectedContent ? (
            <FileContentView filename={selectedFile || ''} content={selectedContent} />
          ) : (
            <div className="no-file-selected">Select a file to preview its contents</div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * File tree view component
 */
function FileTreeView({
  nodes,
  expandedFolders,
  selectedFile,
  onToggleFolder,
  onSelectFile,
  filesAdded,
  filesModified,
  depth = 0,
}: {
  nodes: TreeNode[];
  expandedFolders: Set<string>;
  selectedFile: string | null;
  onToggleFolder: (path: string) => void;
  onSelectFile: (path: string) => void;
  filesAdded: Set<string>;
  filesModified: Set<string>;
  depth?: number;
}) {
  return (
    <ul className="file-tree" style={{ paddingLeft: depth * 16 }}>
      {nodes.map(node => {
        const isAdded = node.type === 'file' && filesAdded.has(node.path);
        const isModified = node.type === 'file' && filesModified.has(node.path);
        const enrichStyle = isAdded
          ? { color: '#22c55e' }
          : isModified
            ? { color: '#eab308' }
            : undefined;
        const enrichIndicator = isAdded ? ' [+]' : isModified ? ' [~]' : '';

        return (
          <li key={node.path}>
            {node.type === 'folder' ? (
              <>
                <button
                  type="button"
                  className="tree-item folder"
                  onClick={() => onToggleFolder(node.path)}
                >
                  <span className="tree-icon">{expandedFolders.has(node.path) ? 'v' : '>'}</span>
                  <span className="tree-name">{node.name}/</span>
                </button>
                {expandedFolders.has(node.path) && node.children && (
                  <FileTreeView
                    nodes={node.children}
                    expandedFolders={expandedFolders}
                    selectedFile={selectedFile}
                    onToggleFolder={onToggleFolder}
                    onSelectFile={onSelectFile}
                    filesAdded={filesAdded}
                    filesModified={filesModified}
                    depth={depth + 1}
                  />
                )}
              </>
            ) : (
              <button
                type="button"
                className={`tree-item file ${selectedFile === node.path ? 'selected' : ''}`}
                onClick={() => onSelectFile(node.path)}
                style={enrichStyle}
              >
                <span className="tree-icon">-</span>
                <span className="tree-name">{node.name}{enrichIndicator}</span>
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * File content view with basic syntax highlighting
 */
function FileContentView({ filename, content }: { filename: string; content: string }) {
  const language = getFileLanguage(filename);
  const lines = content.split('\n');

  return (
    <div className="file-content">
      <div className="file-content-header">
        <span className="filename">{filename}</span>
        <span className="language-badge">{language}</span>
      </div>
      <pre className={`code-block language-${language}`}>
        <code>
          {lines.map((line, index) => (
            <div key={index} className="code-line">
              <span className="line-number">{index + 1}</span>
              <span className="line-content">{line}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

export default Preview;
