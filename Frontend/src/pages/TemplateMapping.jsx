import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Close,
  Add,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { url } from '../App';

export default function PDFFieldMapperMUI() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [renderedImage, setRenderedImage] = useState(null);
  const [templateName, setTemplateName] = useState('');

  const [selectedFieldType, setSelectedFieldType] = useState('');
  const [mappedFields, setMappedFields] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentSelection, setCurrentSelection] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [showSuccess, setShowSuccess] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  const [activeField, setActiveField] = useState(null);


  const location = useLocation();
  const { invoice, template_id, invoice_id, vendor_id, mapFields } = location.state || {};

  const [numPages, setNumPages] = useState(0);
  let navigate = useNavigate();


  const fieldTypes = [
    { value: 'invoice_number', label: 'Invoice Number', type:"string" },
    { value: 'invoice_date', label: 'Invoice Date', type:"date"  },
    { value: 'due_date', label: 'Due Date', type:"date"  },
    { value: 'vendor_name', label: 'Vendor Name',  type:"string"  },
    { value: 'vendor_address', label: 'Vendor Address',  type:"string"  },
    { value: 'total_amount', label: 'Total Amount',  type:"double"  },
    { value: 'subtotal', label: 'Subtotal',  type:"double"  },
    { value: 'tax_amount', label: 'Tax Amount', type:"double"  },
    { value: 'currency', label: 'Currency',  type:"string"  },
    { value: 'po_number', label: 'PO Number',  type:"string"  },
    { value: 'customer_name', label: 'Customer Name', type:"string"  },
    { value: 'customer_address', label: 'Customer Address',  type:"string"  },
  ];

  const fieldColors = {
    invoice_number: { border: 'rgba(211, 47, 47, 0.9)', bg: 'rgba(211, 47, 47, 0.25)' },
    invoice_date: { border: 'rgba(25, 118, 210, 0.9)', bg: 'rgba(25, 118, 210, 0.25)' },
    due_date: { border: 'rgba(237, 108, 2, 0.9)', bg: 'rgba(237, 108, 2, 0.25)' },
    vendor_name: { border: 'rgba(46, 125, 50, 0.9)', bg: 'rgba(46, 125, 50, 0.25)' },
    vendor_address: { border: 'rgba(123, 31, 162, 0.9)', bg: 'rgba(123, 31, 162, 0.25)' },
    total_amount: { border: 'rgba(0, 151, 167, 0.9)', bg: 'rgba(0, 151, 167, 0.25)' },
    subtotal: { border: 'rgba(255, 193, 7, 0.9)', bg: 'rgba(255, 193, 7, 0.25)' },
    tax_amount: { border: 'rgba(255, 87, 34, 0.9)', bg: 'rgba(255, 87, 34, 0.25)' },
    currency: { border: 'rgba(156, 39, 176, 0.9)', bg: 'rgba(156, 39, 176, 0.25)' },
    po_number: { border: 'rgba(63, 81, 181, 0.9)', bg: 'rgba(63, 81, 181, 0.25)' },
    customer_name: { border: 'rgba(0, 188, 212, 0.9)', bg: 'rgba(0, 188, 212, 0.25)' },
    customer_address: { border: 'rgba(205, 220, 57, 0.9)', bg: 'rgba(205, 220, 57, 0.25)' },
  };


  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fieldTypeInfo = {
    invoice_number: { label: "Invoice Number"},
    invoice_date: { label: "Invoice Date" },
    due_date: { label: "Due Date" },
    vendor_name: { label: "Vendor Name" },
    vendor_address: { label: "Vendor Address" },
    total_amount: { label: "Total Amount" },
    subtotal: { label: "Subtotal" },
    tax_amount: { label: "Tax Amount" },
    currency: { label: "Currency" },
    po_number: { label: "PO Number" },
    customer_name: { label: "Customer Name" },
    customer_address: { label: "Customer Address" },
  };

  function convertAPIFieldToMappedField(apiField) {
    const info = fieldTypeInfo[apiField.field_type] || { label: apiField.field_type};
  
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2,5), 
      fieldType: apiField.field_type,
      label: info.label,
      page: parseInt(apiField.page_num),
      left: parseFloat(apiField.x),
      top: parseFloat(apiField.y),
      width: parseFloat(apiField.width),
      height: parseFloat(apiField.height),
    };
  }
  

  useEffect(()=>{
    if(mapFields)
    setMappedFields(mapFields.map(convertAPIFieldToMappedField))

  },[mapFields])

  console.log(mappedFields)


  useEffect(() => {
    if (!invoice || !window.pdfjsLib) return;

    const loadPdf = async () => {
      try {
        let pdf;
        if (invoice instanceof Blob) {
          const arrayBuffer = await invoice.arrayBuffer();
          const typedArray = new Uint8Array(arrayBuffer);

          const loadingTask =
            window.pdfjsLib.getDocument(typedArray);

          pdf = await loadingTask.promise;
        } else if (typeof invoice === "string") {
          const loadingTask =
            window.pdfjsLib.getDocument(invoice);

          pdf = await loadingTask.promise;
        } else {
          console.log("Unsupported invoice type");
          return;
        }

        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error loading PDF:", error);
      }
    };

    loadPdf();
  }, [invoice, window.pdfjsLib]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setIsLoading(true);
      setMappedFields([]);
      setShowSuccess(false);

      const fileReader = new FileReader();
      fileReader.onload = async function () {
        const typedArray = new Uint8Array(this.result);

        try {
          const loadingTask = window.pdfjsLib.getDocument(typedArray);
          const pdf = await loadingTask.promise;
          console.log(pdf)
          setPdfDoc(pdf);
          setTotalPages(pdf.numPages);
          setCurrentPage(1);
          setIsLoading(false);
        } catch (error) {
          console.error('Error loading PDF:', error);
          alert('Error loading PDF file');
          setIsLoading(false);
        }
      };
      fileReader.readAsArrayBuffer(file);
    } else {
      alert('Please upload a valid PDF file');
    }
  };

  const renderPage = async (pageNum) => {
    if (!pdfDoc) return;

    setIsLoading(true);
    const page = await pdfDoc.getPage(pageNum);

    const viewport = page.getViewport({ scale: 1.0 });

    const containerWidth = containerRef.current ? containerRef.current.offsetWidth - 448 : 800; 
    const calculatedScale = containerWidth / viewport.width;

    const pixelRatio = window.devicePixelRatio || 1;
    const renderScale = calculatedScale * pixelRatio * 2.5;
    const scaledViewport = page.getViewport({ scale: renderScale });

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;

    canvas.style.width = `${viewport.width * calculatedScale}px`;
    canvas.style.height = `${viewport.height * calculatedScale}px`;

    setCanvasSize({ width: scaledViewport.width, height: scaledViewport.height });

    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport
    };

    await page.render(renderContext).promise;

    setRenderedImage(canvas.toDataURL());

    redrawAllFields();

    setIsLoading(false);
  };

  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage]);

  const borderColors = [
    'rgba(211, 47, 47, 0.9)',
    'rgba(25, 118, 210, 0.9)',
    'rgba(237, 108, 2, 0.9)',
    'rgba(46, 125, 50, 0.9)',
    'rgba(123, 31, 162, 0.9)',
    'rgba(0, 151, 167, 0.9)',
  ];

  const redrawAllFields = () => {
    if (!renderedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);

      mappedFields.forEach((field, index) => {
        if (field.page === currentPage) {
          drawFieldBox(context, field, index);
        }
      });

      if (currentSelection && isSelecting) {
        const { x, y, width, height } = currentSelection;
        context.fillStyle = 'rgba(25, 118, 210, 0.2)';
        context.fillRect(x, y, width, height);
        context.strokeStyle = 'rgba(25, 118, 210, 0.8)';
        context.lineWidth = 2;
        context.strokeRect(x, y, width, height);
      }
    };
    img.src = renderedImage;
  };

  const drawFieldBox = (context, field, index) => {
    const x = (field.left / 100) * canvasSize.width;
    const y = (field.top / 100) * canvasSize.height;
    const width = (field.width / 100) * canvasSize.width;
    const height = (field.height / 100) * canvasSize.height;

    const colors = fieldColors[field.fieldType] || { border: 'rgba(0,0,0,0.9)', bg: 'rgba(0,0,0,0.25)' };

    context.fillStyle = colors.bg;
    context.fillRect(x, y, width, height);

    context.strokeStyle = colors.border;
    context.lineWidth = 2;
    context.strokeRect(x, y, width, height);

    context.fillStyle = colors.border;
    context.font = 'bold 12px Roboto, Arial, sans-serif';
    const textWidth = context.measureText(field.label).width;
    context.fillRect(x, y - 20, textWidth + 10, 18);
    context.fillStyle = '#ffffff';
    context.fillText(field.label, x + 5, y - 6);
  };


  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;

    return {
      x: (rawX / scale) * (canvas.width / (rect.width / scale)),
      y: (rawY / scale) * (canvas.height / (rect.height / scale))
    };
  };

  const handleMouseDown = (e) => {
    if (!selectedFieldType) {
      return;
    }

    e.preventDefault();
    const pos = getCanvasCoordinates(e);
    setStartPos(pos);
    setIsSelecting(true);
    setCurrentSelection(null);
  };

  const handleMouseMove = (e) => {
    if (!isSelecting || !startPos) return;
    e.preventDefault();
    const pos = getCanvasCoordinates(e);

    const x = Math.min(startPos.x, pos.x);
    const y = Math.min(startPos.y, pos.y);
    const width = Math.abs(pos.x - startPos.x);
    const height = Math.abs(pos.y - startPos.y);

    setCurrentSelection({ x, y, width, height });
    redrawWithCurrentSelection({ x, y, width, height });
  };

  const redrawWithCurrentSelection = (selection) => {
    if (!renderedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);

      mappedFields.forEach((field, index) => {
        if (field.page === currentPage) {
          drawFieldBox(context, field, index);
        }
      });

      const { x, y, width, height } = selection;
      context.fillStyle = 'rgba(25, 118, 210, 0.2)';
      context.fillRect(x, y, width, height);
      context.strokeStyle = 'rgba(25, 118, 210, 0.8)';
      context.lineWidth = 2;
      context.strokeRect(x, y, width, height);
    };
    img.src = renderedImage;
  };

  const handleMouseUp = async (e) => {
    if (!isSelecting || !startPos) return;
    e.preventDefault();
    const pos = getCanvasCoordinates(e);
    setIsSelecting(false);

    const x = Math.min(startPos.x, pos.x);
    const y = Math.min(startPos.y, pos.y);
    const width = Math.abs(pos.x - startPos.x);
    const height = Math.abs(pos.y - startPos.y);

    if (width < 5 || height < 5) {
      setCurrentSelection(null);
      setStartPos(null);
      redrawAllFields();
      return;
    }

    const leftPercent = (x / canvasSize.width) * 100;
    const topPercent = (y / canvasSize.height) * 100;
    const widthPercent = (width / canvasSize.width) * 100;
    const heightPercent = (height / canvasSize.height) * 100;



    const fieldType = fieldTypes.find(f => f.value === selectedFieldType);

    const newField = {
      id: Date.now().toString(),
      fieldType: selectedFieldType,
      label: fieldType.label,
      type:fieldType.type,
      page: currentPage,
      left: leftPercent,
      top: topPercent,
      width: widthPercent,
      height: heightPercent,
    };

    setMappedFields([...mappedFields, newField]);
    setCurrentSelection(null);
    setStartPos(null);

    // setTimeout(() => redrawAllFields(), 100);
    // setDummy(Math.random())
  };

  useEffect(() => {
    if (pdfDoc) {
      redrawAllFields();
    }
  }, [mappedFields, currentPage, renderedImage]);


  const SCROLL_SENSITIVITY = 0.0005;
  const MAX_ZOOM = 10;
  const MIN_ZOOM = 0.3;

  const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

  const handleWheel = (event) => {
    event.preventDefault();
    const { deltaY } = event;
    if (!isSelecting) {
      setScale((zoom) =>
        clamp(zoom + deltaY * SCROLL_SENSITIVITY * -1, MIN_ZOOM, MAX_ZOOM)
      );
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel);
      return () => {
        canvas.removeEventListener('wheel', handleWheel);
      }
    }
  }, [handleWheel]);

  useEffect(()=>{
    if(template_id){
      axios.get(url+`templates/${template_id}`).then((res)=>{
        setTemplateName(res.data.details.template_name)
      })
    }
  },[template_id])

  const [dummy, setDummy] = useState();

  const removeField = (fieldId) => {
    setMappedFields(mappedFields.filter(f => f.id !== fieldId));
    // setTimeout(() => redrawAllFields(), 100);
    // setDummy(Math.random())
  };

  const getCurrentDateTime = () => {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0"); 
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    return `${yyyy}/${mm}/${dd} ${hh}:${min}:${ss}`;
};

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (mappedFields.length === 0) {
      alert('Please map at least one field');
      return;
    }

    let temp_id = template_id 

    const template = {
      name: templateName,
      // pdfFileName: pdfFile.name,
      totalPages: totalPages,
      fields: mappedFields.map(field => ({
        fieldType: field.fieldType,
        page: field.page,
        left: field.left,
        top: field.top,
        width: field.width,
        height: field.height,
      }))
    };
    console.log(!temp_id)
    if(!temp_id)
    {
      await axios.post(url+`vendors/${vendor_id}/templates`,{
        template_name: templateName,
        created_at: getCurrentDateTime(),
        created_by:"naraen",
        invoice_id:invoice_id
      }).then((res)=>{
        temp_id = res.data.template_id
      })
    }


    const transformedFields = mappedFields.map(field => ({
      field_type: field.fieldType,         
      page_num: field.page,                  
      x: field.left.toFixed(2),             
      y: field.top.toFixed(2),              
      width: field.width.toFixed(2),       
      height: field.height.toFixed(2),      
      field_datatype: field.type,             
    }));   

    axios.post(url+`templates/${temp_id}/fields`,{
      fields:transformedFields 
    }).then((res)=>{
      setShowSuccess(true);
    setTimeout(() => {setShowSuccess(false); navigate('/dashboard')}, 3000);
    })

    console.log('Template to save:', JSON.stringify(template, null, 2));


    
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const clearAll = () => {
    setMappedFields([]);
    setActiveField(null);
  };

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '-webkit-fill-available'}}>
      <div style={{
                width: '100%', height: "10vh", background: "#01014e", display: 'flex', alignItems: 'flex-end',
                paddingLeft: '50px'
            }}></div>  
      <Container sx={{ background: "#f5f5f5", width: '100%', marginTop:'24px' }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Invoice Field Mapper
          </Typography>
        </Box>

              <div style={{marginBottom:'24px'}}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., 'Acme Corp Invoice Template'"
                  variant="outlined"
                  sx={{background:'white'}}
                />
              </div>

      
        {showSuccess && (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
            Template saved successfully!.
          </Alert>
        )}

        {pdfDoc && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', gap: '24px',
          }}>
            <Box sx={{
              background: 'white', height: 'min-content', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px',
              "box-shadow": "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)", borderRadius: '4px'
            }}>
              {/* {fieldTypes.map((field, idx) => (
                <Card key={field.value}
                  onClick={() => { setSelectedFieldType(field.value) }}
                  sx={{
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: borderColors[idx]
                  }}
                >
                  <CardContent sx={{ padding: '12px !important' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>{field.label}</span>
                    </Stack>
                  </CardContent>
                </Card>
              ))} */}
              <Stack spacing={2}>
                {fieldTypes.map((field) => {
                  const isMapped = mappedFields.some(item => item.fieldType === field.value);
                  const isActive = activeField === field.value;
                  const colors = fieldColors[field.value] || { border: '#ccc', bg: '#f5f5f5' };

                  return (
                    <Paper
                      key={field.value} 
                      onClick={() => setSelectedFieldType(field.value)}
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        border: isActive
                          ? `3px solid ${colors.border}`
                          : isMapped
                            ? `2px solid ${colors.border}`
                            : `1px solid #ddd`,
                        backgroundColor: isMapped ? colors.bg : '#fff',
                      }}
                    >
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="body2">{field.label}</Typography>
                        {isMapped ? (
                          <Close
                            onClick={(e) => {
                              e.stopPropagation(); 
                              removeField(mappedFields.find(item => item.fieldType === field.value).id);
                            }}
                          />
                        ) : (
                          <Add />
                        )}
                      </Stack>
                    </Paper>
                  );
                })}

                <Button onClick={clearAll} variant="text">
                  Clear All
                </Button>
              </Stack>


            </Box>
            <div style={{ width: '-webkit-fill-available' }}>
              <Card elevation={3}>
                <CardHeader
                  title="Invoice Viewer"
                  subheader={`Page ${currentPage} of ${totalPages}`}
                  sx={{ bgcolor: '#fafafa' }}
                />
                <Divider />

                <CardContent>


                  {selectedFieldType && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      <strong>Click and drag</strong> on the PDF to map:{' '}
                      <strong>
                        {fieldTypes.find(f => f.value === selectedFieldType)?.label}
                      </strong>
                    </Alert>
                  )}

                  {!selectedFieldType && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                      Please select a field type before mapping
                    </Alert>
                  )}

                  <Stack
                    direction="row"
                    spacing={2}
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 3 }}
                    flexWrap="wrap"
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconButton
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        color="primary"
                      >
                        <NavigateBeforeIcon />
                      </IconButton>
                      <Chip
                        label={`${currentPage} / ${totalPages}`}
                        color="primary"
                        variant="outlined"
                      />
                      <IconButton
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        color="primary"
                      >
                        <NavigateNextIcon />
                      </IconButton>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <IconButton onClick={zoomOut} color="primary">
                        <ZoomOutIcon />
                      </IconButton>
                      <Chip
                        label={`${Math.round(scale * 100)}%`}
                        color="default"
                        variant="outlined"
                      />
                      <IconButton onClick={zoomIn} color="primary">
                        <ZoomInIcon />
                      </IconButton>
                    </Stack>
                  </Stack>

                  <Box
                    ref={containerRef}
                    sx={{
                      bgcolor: '#e0e0e0',
                      p: 2,
                      borderRadius: 1,
                      maxHeight: 800,
                      overflow: 'auto',
                      display: 'flex',
                      justifyContent: scale > 1 ? 'flex-start' : 'center',
                      alignItems: scale > 1 ? 'flex-start' : 'center'
                    }}
                  >
                    {isLoading && (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <CircularProgress size={60} />
                        <Typography variant="body1" sx={{ mt: 2 }}>
                          Loading PDF...
                        </Typography>
                      </Box>
                    )}
                    <Box
                      sx={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        transition: 'transform 0.2s ease-in-out',
                        minWidth: 'fit-content',
                        minHeight: 'fit-content'
                      }}
                    >
                      <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={() => {
                          if (isSelecting) {
                            setIsSelecting(false);
                          }
                        }}
                        style={{
                          display: 'block',
                          cursor: selectedFieldType ? 'crosshair' : 'default',
                          touchAction: 'none',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                          backgroundColor: 'white'
                        }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </div>


          </div>
        )}

        {pdfDoc &&
          <div
            style={{ marginTop: '12px' }}
          >
            <Card elevation={3} sx={{ position: 'sticky', top: 16 }}>
              <CardHeader
                title="Mapped Fields"
                subheader={`${mappedFields.length} field(s)`}
                sx={{ bgcolor: '#fafafa' }}
              />
              <Divider />

              <CardContent sx={{ maxHeight: 600, overflow: 'auto', p: 2 }}>
                {mappedFields.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <DescriptionIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      No fields mapped yet
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                      Select a field type and click on the PDF
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {mappedFields.map((field, index) => (
                      <Paper
                        key={field.id}
                        elevation={1}
                        sx={{
                          mb: 1.5,
                          p: 1.5,
                          bgcolor: '#fafafa',
                          '&:hover': { bgcolor: '#f0f0f0' }
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Typography variant="body2">{field.icon}</Typography>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {field.label}
                              </Typography>
                            </Stack>
                            <Chip
                              label={`Page ${field.page}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mb: 1 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              L: {field.left.toFixed(1)}% | T: {field.top.toFixed(1)}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              W: {field.width.toFixed(1)}% | H: {field.height.toFixed(1)}%
                            </Typography>
                          </Box>
                          <Tooltip title="Remove field">
                            <IconButton
                              size="small"
                              onClick={() => removeField(field.id)}
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                  </List>
                )}
              </CardContent>

              <Divider />

              <Box sx={{ p: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<SaveIcon />}
                  onClick={saveTemplate}
                  disabled={mappedFields.length === 0 || !templateName}
                >
                  Save Template
                </Button>
              </Box>
            </Card>
          </div>}

        {!pdfDoc && !isLoading && (
          <Paper elevation={3} sx={{ p: 8, textAlign: 'center' }}>
            <DescriptionIcon sx={{ fontSize: 96, color: 'text.disabled', mb: 3 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No PDF uploaded yet
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Upload an invoice PDF to start mapping fields
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
}