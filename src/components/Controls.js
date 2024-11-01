// components/Controls.js
import React from "react";

const Controls = ({
  onSaveToDatabase,
  onDownloadLabels,
  onUseModel,
  onClearLabels,
  onReloadFromDatabase,
}) => (
  <div className="controls-container">
    <div className="controls">
      <button className="control-button" onClick={onSaveToDatabase}>
        Save Labels to Database
      </button>
      <div className="divider"></div>
      <button className="control-button" onClick={onDownloadLabels}>
        Download Labels
      </button>
      <div className="divider"></div>
      <button className="control-button" onClick={onUseModel}>
        Use Model
      </button>
      <div className="divider"></div>
      <button className="control-button" onClick={onClearLabels}>
        Clear Labels
      </button>
      <div className="divider"></div>
      <button className="control-button" onClick={onReloadFromDatabase}>
        Reload from Database
      </button>
    </div>
  </div>
);

export default Controls;
