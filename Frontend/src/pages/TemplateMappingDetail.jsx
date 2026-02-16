import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";

import {
  Box,
  Container,
  Typography,
  IconButton,
  Button,
  Grid,
  Paper,
  Divider,
  Stack
} from "@mui/material";

import {
  ChevronLeft,
  ChevronRight,
  Close,
  Add,
  Info
} from "@mui/icons-material";

import { newlyAddedVendors } from "../data/mockData";

export default function TemplateMappingDetail() {
  const navigate = useNavigate();

  const MappingFields = [
    "invoiceDate",
    "invoiceNumber",
    "vendorName",
    "vendorAddress",
    "paymentTerms",
  ];

  const fieldLabels = {
    invoiceDate: "Invoice Date",
    invoiceNumber: "Invoice Number",
    vendorName: "Vendor Name",
    vendorAddress: "Vendor Address",
    paymentTerms: "Payment Terms",
  };

  const fieldColors = {
    invoiceDate: "239, 68, 68",
    invoiceNumber: "59, 130, 246",
    vendorName: "251, 191, 36",
    vendorAddress: "34, 197, 94",
    paymentTerms: "168, 85, 247",
  };

  const [mappedFields, setMappedFields] = useState({
    invoiceDate: null,
    invoiceNumber: null,
    vendorName: null,
    vendorAddress: null,
    paymentTerms: null,
  });

  const [currentVendorIndex, setCurrentVendorIndex] = useState(0);
  const [activeField, setActiveField] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState(null);

  const canvasRef = useRef(null);

  const currentVendor = newlyAddedVendors[currentVendorIndex];

  useEffect(() => {
    drawCanvas();
  }, [mappedFields, currentRect]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = 850;
    canvas.height = 1100;

    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#000";
    ctx.font = "bold 18px Arial";
    ctx.fillText("Invoice no: 17045625", 40, 60);

    ctx.font = "14px Arial";
    ctx.fillText("Date of issue: 11/01/2017", 40, 85);

    Object.entries(mappedFields).forEach(([field, rect]) => {
      if (rect) {
        const color = fieldColors[field];
        ctx.strokeStyle = `rgb(${color})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);

        ctx.fillStyle = `rgba(${color}, 0.15)`;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
      }
    });

    if (currentRect && activeField) {
      const color = fieldColors[activeField];
      ctx.strokeStyle = `rgb(${color})`;
      ctx.strokeRect(
        currentRect.x,
        currentRect.y,
        currentRect.width,
        currentRect.height
      );

      ctx.fillStyle = `rgba(${color}, 0.15)`;
      ctx.fillRect(
        currentRect.x,
        currentRect.y,
        currentRect.width,
        currentRect.height
      );
    }
  };

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e) => {
    if (!activeField) return;
    const pos = getCoords(e);
    setIsDrawing(true);
    setStartPos(pos);
    setCurrentRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !activeField) return;

    const pos = getCoords(e);
    const width = pos.x - startPos.x;
    const height = pos.y - startPos.y;

    setCurrentRect({
      x: width < 0 ? pos.x : startPos.x,
      y: height < 0 ? pos.y : startPos.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !activeField || !currentRect) return;

    if (currentRect.width > 10 && currentRect.height > 10) {
      setMappedFields({
        ...mappedFields,
        [activeField]: currentRect,
      });
    }

    setIsDrawing(false);
    setCurrentRect(null);
    setActiveField(null);
  };

  const toggleField = (field) => {
    if (mappedFields[field]) {
      setMappedFields({ ...mappedFields, [field]: null });
    } else {
      setActiveField(field);
    }
  };

  const clearAll = () => {
    setMappedFields({
      invoiceDate: null,
      invoiceNumber: null,
      vendorName: null,
      vendorAddress: null,
      paymentTerms: null,
    });
    setActiveField(null);
  };

  const handleNext = () => {
    if (currentVendorIndex < newlyAddedVendors.length - 1) {
      setCurrentVendorIndex(currentVendorIndex + 1);
      clearAll();
    } else {
      navigate("/");
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Stack direction="row" justifyContent="space-between" mb={4}>
        <Typography variant="h4" sx={{ color: "#002855" }}>
          Invoice Template Mapping
        </Typography>
        <IconButton>
          <Info sx={{ color: "#4AA3DF" }} />
        </IconButton>
      </Stack>

      <Grid container spacing={4}>
        {/* Left Panel */}
        <Grid item xs={3}>
          <Stack spacing={2}>
            {MappingFields.map((field) => {
              const isMapped = mappedFields[field] !== null;
              const isActive = activeField === field;

              return (
                <Paper
                  key={field}
                  onClick={() => toggleField(field)}
                  sx={{
                    p: 2,
                    cursor: "pointer",
                    border: isActive
                      ? "3px solid #4AA3DF"
                      : isMapped
                      ? "2px solid #ccc"
                      : "1px solid #ddd",
                    backgroundColor: isMapped ? "#f5f5f5" : "#fff",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2">
                      {fieldLabels[field]}
                    </Typography>
                    {isMapped ? <Close /> : <Add />}
                  </Stack>
                </Paper>
              );
            })}

            <Button onClick={clearAll} variant="text">
              Clear All
            </Button>
          </Stack>
        </Grid>

        {/* Right Panel */}
        <Grid item xs={9}>
          <Paper>
            <Box
              sx={{
                p: 2,
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body2">
                {currentVendor?.name}
              </Typography>
              <Stack direction="row">
                <IconButton>
                  <ChevronLeft />
                </IconButton>
                <IconButton>
                  <ChevronRight />
                </IconButton>
              </Stack>
            </Box>

            <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
              <canvas
                ref={canvasRef}
                style={{
                  border: "1px solid #ccc",
                  width: "100%",
                  maxWidth: "850px",
                  cursor: "crosshair",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Stack direction="row" justifyContent="center" spacing={3} mt={6}>
        <Button variant="outlined" onClick={handleNext}>
          Skip
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          sx={{
            backgroundColor: "#FFB800",
            color: "black",
            "&:hover": { backgroundColor: "#E5A600" },
          }}
        >
          Save & Next
        </Button>
      </Stack>
    </Container>
  );
}
