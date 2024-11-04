import React from "react";
import { Button, Box } from "@mui/material";

const Controls = ({
  onSaveToDatabase,
  onDownloadLabels,
  onUseModel,
  onClearLabels,
  onReloadFromDatabase,
}) => (
  <Box display="flex" justifyContent="center" mt={2} mb={2}>
    <Button onClick={onSaveToDatabase} variant="contained" color="secondary">
      Save Labels to Database
    </Button>
    <Button onClick={onDownloadLabels} variant="contained" color="secondary" sx={{ ml: 1 }}>
      Download Labels
    </Button>
    <Button onClick={onUseModel} variant="contained" color="secondary" sx={{ ml: 1 }}>
      Use Model
    </Button>
    <Button onClick={onClearLabels} variant="contained" color="secondary" sx={{ ml: 1 }}>
      Clear Labels
    </Button>
    <Button onClick={onReloadFromDatabase} variant="contained" color="secondary" sx={{ ml: 1 }}>
      Reload from Database
    </Button>
  </Box>
);

export default Controls;
