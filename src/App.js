import React, { useState } from 'react';
import * as go from 'gojs';
import { ReactDiagram } from 'gojs-react';
import "./styles.css";

export default function App() {
  // state variables
  const [nodeDataArray, setNodeDataArray] = useState([
    { key: 1, text: 'Alpha', color: 'lightblue' },
    { key: 2, text: 'Beta', color: 'orange' },
    { key: 3, text: 'Gamma', color: 'lightgreen' },
    { key: 4, text: 'Delta', color: 'pink' }
  ]);
  const [linkDataArray, setLinkDataArray] = useState([
    { key: -1, from: 1, to: 2 },
    { key: -2, from: 1, to: 3 },
    { key: -3, from: 2, to: 2 },
    { key: -4, from: 3, to: 4 },
    { key: -5, from: 4, to: 1 }
  ]);
  const [skipsDiagramUpdate, setSkipsDiagramUpdate] = useState(false);

  // maps for faster state modification
  const mapNodeKeyIdx = new Map();
  const mapLinkKeyIdx = new Map();
  refreshNodeIndex(nodeDataArray);
  refreshLinkIndex(linkDataArray);

  function refreshNodeIndex(nodeArr) {
    mapNodeKeyIdx.clear();
    nodeArr.forEach((n, idx) => {
      mapNodeKeyIdx.set(n.key, idx);
    });
  }

  function refreshLinkIndex(linkArr) {
    mapLinkKeyIdx.clear();
    linkArr.forEach((l, idx) => {
      mapLinkKeyIdx.set(l.key, idx);
    });
  }

  function handleModelChange(obj) {
    if (obj === null) return;
    const insertedNodeKeys = obj.insertedNodeKeys;
    const modifiedNodeData = obj.modifiedNodeData;
    const removedNodeKeys = obj.removedNodeKeys;
    const insertedLinkKeys = obj.insertedLinkKeys;
    const modifiedLinkData = obj.modifiedLinkData;
    const removedLinkKeys = obj.removedLinkKeys;

    // copy data to new array, but maintain references
    let nodeArr = nodeDataArray.slice();
    let linkArr = linkDataArray.slice();
    // maintain maps of modified data so insertions don't need slow lookups
    const modifiedNodeMap = new Map();
    const modifiedLinkMap = new Map();
    // only update state if we've actually made a change
    let arrChanged = false;

    // handle node changes
    if (modifiedNodeData) {
      modifiedNodeData.forEach((nd) => {
        modifiedNodeMap.set(nd.key, nd);
        const idx = mapNodeKeyIdx.get(nd.key);
        if (idx !== undefined && idx >= 0) {
          nodeArr.splice(idx, 1, nd);
          arrChanged = true;
        }
      });
    }
    if (insertedNodeKeys) {
      insertedNodeKeys.forEach((key) => {
        const nd = modifiedNodeMap.get(key);
        const idx = mapNodeKeyIdx.get(key);
        if (nd && idx === undefined) {
          mapNodeKeyIdx.set(nd.key, nodeArr.length);
          nodeArr.push(nd);
          arrChanged = true;
        }
      });
    }
    if (removedNodeKeys) {
      nodeArr = nodeArr.filter((nd) => {
        if (removedNodeKeys.includes(nd.key)) {
          arrChanged = true;
          return false;
        }
        return true;
      });
      refreshNodeIndex(nodeArr);
    }
    // handle link changes
    if (modifiedLinkData) {
      modifiedLinkData.forEach((ld) => {
        modifiedLinkMap.set(ld.key, ld);
        const idx = mapLinkKeyIdx.get(ld.key);
        if (idx !== undefined && idx >= 0) {
          linkArr.splice(idx, 1, ld);
          arrChanged = true;
        }
      });
    }
    if (insertedLinkKeys) {
      insertedLinkKeys.forEach((key) => {
        const ld = modifiedLinkMap.get(key);
        const idx = mapLinkKeyIdx.get(key);
        if (ld && idx === undefined) {
          mapLinkKeyIdx.set(ld.key, linkArr.length);
          linkArr.push(ld);
          arrChanged = true;
        }
      });
    }
    if (removedLinkKeys) {
      linkArr = linkArr.filter((ld) => {
        if (removedLinkKeys.includes(ld.key)) {
          arrChanged = true;
          return false;
        }
        return true;
      });
      refreshLinkIndex(linkArr);
    }

    if (arrChanged) {
      setNodeDataArray(nodeArr);
      setLinkDataArray(linkArr);
      setSkipsDiagramUpdate(true);
    }
  }

  function initDiagram() {
    const $ = go.GraphObject.make;
    const diagram = $(go.Diagram,
                    {
                      'undoManager.isEnabled': true,  // enable undo & redo
                      model: $(go.GraphLinksModel, { linkKeyProperty: 'key' })
                    });
  
    // define a simple Node template
    diagram.nodeTemplate =
      $(go.Node, 'Auto',  // the Shape will go around the TextBlock
        $(go.Shape, 'RoundedRectangle', { strokeWidth: 0, fill: 'white' },
          // Shape.fill is bound to Node.data.color
          new go.Binding('fill', 'color')),
        $(go.TextBlock,
          { margin: 8, editable: true },  // some room around the text
          // TextBlock.text is bound to Node.data.key
          new go.Binding('text').makeTwoWay())
      );
  
    return diagram;
  }

  return (
    <ReactDiagram
      divClassName = 'diagram-component'
      initDiagram = {initDiagram}
      nodeDataArray = {nodeDataArray}
      linkDataArray = {linkDataArray}
      skipsDiagramUpdate = {skipsDiagramUpdate}
      onModelChange = {handleModelChange}
    />
  );
}
