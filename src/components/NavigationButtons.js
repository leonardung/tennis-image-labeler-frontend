import React from "react";
import { Button, Box } from "@mui/material";

const NavigationButtons = ({ onPrev, onNext, disablePrev, disableNext }) => (
  <Box display="flex" justifyContent="center" mt={2}>
    <Button onClick={onPrev} disabled={disablePrev} variant="contained" color="primary">
      Previous Image
    </Button>
    <Button onClick={onNext} disabled={disableNext} variant="contained" color="primary" sx={{ ml: 1 }}>
      Next Image
    </Button>
  </Box>
);

export default NavigationButtons;
