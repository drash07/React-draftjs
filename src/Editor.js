import React, { useState, useEffect } from 'react';
import { Editor, EditorState, RichUtils, SelectionState, convertToRaw, convertFromRaw, Modifier } from 'draft-js';
import 'draft-js/dist/Draft.css';
import './Editor.css';

const MyEditor = ({ onSave }) => {
  const [editorState, setEditorState] = useState(() => EditorState.createEmpty());

  useEffect(() => {
    loadContent();
  }, []);

  const styleMap = {
    RED: { color: 'red' },
  };

  const handleKeyCommand = (command, editorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const handleBeforeInput = (chars, editorState) => {
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    const blockKey = selection.getStartKey();
    const block = content.getBlockForKey(blockKey);
    const text = block.getText();

    if (chars === ' ') {
      const formatActions = [
        { prefix: '#', blockType: 'header-one' },
        { prefix: '***', inlineStyle: 'UNDERLINE' },
        { prefix: '**', inlineStyle: 'RED' },
        { prefix: '*', inlineStyle: 'BOLD' },
      ];

      for (let action of formatActions) {
        if (text.startsWith(action.prefix)) {
          return handleTextFormatting(action.prefix.length, action.blockType, action.inlineStyle);
        }
      }

      if (text.endsWith('```')) {
        return handleCodeBlockFormatting();
      }
    }
    return 'not-handled';

    function handleTextFormatting(prefixLength, blockType, inlineStyle) {
      const newText = text.slice(prefixLength);
      const newSelection = selection.merge({
        anchorOffset: 0,
        focusOffset: text.length,
      });

      let newContentState = Modifier.replaceText(content, newSelection, newText);
      let newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');

      const updatedSelection = SelectionState.createEmpty(blockKey).merge({
        anchorOffset: 0,
        focusOffset: newText.length,
        isBackward: false,
      });

      newEditorState = EditorState.forceSelection(newEditorState, updatedSelection);

      if (blockType) {
        newEditorState = RichUtils.toggleBlockType(newEditorState, blockType);
      } else if (inlineStyle) {
        newEditorState = RichUtils.toggleInlineStyle(newEditorState, inlineStyle);
      }

      setEditorState(newEditorState);
      return 'handled';
    }

    function handleCodeBlockFormatting() {
      const newContentState = Modifier.replaceText(
        content,
        selection.merge({ anchorOffset: text.length - 3, focusOffset: text.length }),
        ''
      );

      const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');
      setEditorState(RichUtils.toggleBlockType(newEditorState, 'code-block'));
      return 'handled';
    }
  };

  const saveContent = () => {
    try {
      const contentState = editorState.getCurrentContent();
      const rawContentState = convertToRaw(contentState);
      localStorage.setItem('draftjs-content', JSON.stringify(rawContentState));
      onSave();
    } catch (error) {
      console.error('Error saving content:', error);
    }
  };

  const loadContent = () => {
    try {
      const savedContent = localStorage.getItem('draftjs-content');
      if (savedContent) {
        const rawContentState = JSON.parse(savedContent);
        const contentState = convertFromRaw(rawContentState);
        setEditorState(EditorState.createWithContent(contentState));
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setEditorState(EditorState.createEmpty());
    }
  };

  return (
    <div className="editor">
      <div className="save-button">
        <button onClick={saveContent}>Save</button>
      </div>
      <div className="editor-container">
        <Editor
          editorState={editorState}
          onChange={setEditorState}
          handleKeyCommand={handleKeyCommand}
          handleBeforeInput={handleBeforeInput}
          customStyleMap={styleMap}
          placeholder="Start typing..."
        />
      </div>
    </div>
  );
};

export default MyEditor;
