import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
    Box,
    Container,
    Typography,
    Grid,
    Paper,
    Button,
    List,
    ListItemButton,
    ListItemText,
    Badge,
    IconButton,
    Divider,
    Stack,
    Card,
    CardHeader,
    CardContent
} from "@mui/material";
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle
} from "@mui/icons-material";


import samplePdf from "../assets/sample.pdf";
import { newlyAddedVendors } from "../data/mockData";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { url } from "../App";




export default function TemplateMapping() {
    const navigate = useNavigate();

    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [mappedFields, setMappedFields] = useState([]);
    const [existingTemplates, setExistingTemplates] = useState([]);
    

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


    const [newlyAddedVendors, setNewlyAddedVendors] = useState([]);

    const [selectedVendor, setSelectedVendor] = useState(newlyAddedVendors[0]?.vendor_id)

    const location = useLocation();
    const { invoice, invoice_id } = location.state || {};

    const get_existing_templates = () => {
        if (selectedVendor)
            axios.get(url+`vendors/${selectedVendor}/templates`).then((res) => {
                setExistingTemplates(res.data.details)
                setSelectedTemplate(res.data.details[0]);
                setMappedFields(res.data.details[0].template_fields)
            }).catch((err) => { console.log(err) })
    }


    const get_vendor_list = () => {
        axios.get(url+'vendors').then((res) => {
            setNewlyAddedVendors(res.data.details)
        }).catch((err) => { console.log(err) })
    }

    useEffect(() => {
        get_existing_templates();
        setSelectedTemplate(null);
        setMappedFields([]);
    }, [selectedVendor])

    useEffect(() => {
        get_vendor_list();
    }, [])

    const handleStartMapping = () => {
        axios.patch(url+`invoices/${invoice_id}/${selectedVendor}`).then((res)=>{
            navigate("/template-mapping",{
                state:{
                    invoice: invoice,
                    template_id:selectedTemplate?.template_id,
                    invoice_id:invoice_id,
                    vendor_id: selectedVendor,
                    mapFields: mappedFields
                }
            });
        })
        .catch((err)=>{console.log(err)})
        
    };

    const handleSkipAll = () => {
        navigate("/dashboard");
    };

    const loadTemplate = (template) => {
        setSelectedTemplate(template);
        setMappedFields(template.template_fields);
        setCurrentPage(1);
    };

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const canvasRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    
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
                setNumPages(pdf.numPages);
                setCurrentPage(1);
            } catch (error) {
                console.error("Error loading PDF:", error);
            }
        };
    
        loadPdf();
    }, [invoice, window.pdfjsLib]);
    


    useEffect(() => {
        const renderPage = async () => {
            if (!pdfDoc) return;

            const page = await pdfDoc.getPage(currentPage);
            const scale = 2;
            const viewport = page.getViewport({ scale });

            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;

            if (selectedTemplate) {
                console.log(selectedTemplate)
                selectedTemplate.template_fields
                    .filter(field => field.page_num == currentPage)
                    .forEach(field => {

                        const rectX = (field.x / 100) * viewport.width;
                        const rectY = (field.y / 100) * viewport.height;
                        const rectWidth = (field.width / 100) * viewport.width;
                        const rectHeight = (field.height / 100) * viewport.height;

                        context.beginPath();
                        context.strokeStyle = "#2e7d32";
                        context.lineWidth = 2;

                        context.strokeRect(
                            rectX,
                            rectY,
                            rectWidth,
                            rectHeight
                        );

                        context.fillStyle = "#2e7d32";
                        context.font = "14px Arial";
                        context.fillText(
                            field.field_type,
                            rectX,
                            rectY - 5
                        );
                    });

            }
        };

        renderPage();
    }, [pdfDoc, currentPage, selectedTemplate]);


    const goNext = () => {
        if (currentPage < numPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const goPrev = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    useEffect(() => {
        setSelectedVendor(newlyAddedVendors[0]?.vendor_id)
    }, [newlyAddedVendors])



    console.log(selectedVendor)
    return (
        <Box sx={{ minHeight: "100vh", background: "#F9FAFB" }}>
            <div style={{
                width: '100%', height: "10vh", background: "#01014e", display: 'flex', alignItems: 'flex-end',
                paddingLeft: '50px'
            }}></div>
            <Container sx={{ padding: "24px 50px 24px 50px !important", maxWidth:'none !important' }}>
                <Typography
                    variant="h4"
                    sx={{ color: "#002855", fontWeight: 600, mb: 2 }}
                >
                    Invoices Template Mapping
                </Typography>

                <Typography variant="body1" color="text.secondary" mb={4}>
                    Perform vendor invoice mapping for each newly added vendor.
                </Typography>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={2} sx={{ mb: 3 }}>
                            <Box
                                sx={{
                                    bgcolor: "#4AA3DF",
                                    color: "white",
                                    px: 3,
                                    py: 2,
                                    display: "flex",
                                    justifyContent: "space-between"
                                }}
                            >
                                <Typography>New Vendors</Typography>
                                <Badge
                                    badgeContent={newlyAddedVendors.length}
                                    color="secondary"
                                />
                            </Box>

                            <List>
                                {newlyAddedVendors.map((vendor) => (
                                    <ListItemButton
                                        key={vendor.vendor_id}
                                        selected={selectedVendor === vendor.vendor_id}
                                        onClick={() => setSelectedVendor(vendor.vendor_id)}
                                        sx={{
                                            borderRadius: 2,
                                            mb: 1,
                                            transition: "all 0.2s ease",
                                            "&.Mui-selected": {
                                                backgroundColor: "#e3f2fd",
                                                color: "#0d47a1",
                                                fontWeight: "bold",
                                            },
                                            "&.Mui-selected:hover": {
                                                backgroundColor: "#bbdefb",
                                            },
                                        }}
                                    >
                                        <ListItemText primary={vendor.vendor_name} />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Paper>

                        <Card elevation={3}>
                            <CardHeader
                                title="Existing Templates"
                                subheader={`${existingTemplates.length} available`}
                            />
                            <Divider />
                            <CardContent>
                                {existingTemplates.map((template) => (
                                    <Paper
                                        key={template.template_id}
                                        elevation={selectedTemplate?.template_id === template.template_id ? 4 : 1}
                                        sx={{
                                            mb: 2,
                                            p: 2,
                                            cursor: "pointer",
                                            border:
                                                selectedTemplate?.template_id === template.template_id
                                                    ? "2px solid #2e7d32"
                                                    : "1px solid #e0e0e0",
                                            bgcolor:
                                                selectedTemplate?.template_id === template.template_id
                                                    ? "#e8f5e9"
                                                    : "#fafafa"
                                        }}
                                        onClick={() => loadTemplate(template)}
                                    >
                                        <Stack
                                            direction="row"
                                            justifyContent="space-between"
                                            alignItems="center"
                                        >
                                            <Typography variant="subtitle2">
                                                {template.template_name}
                                            </Typography>

                                            {selectedTemplate?.template_id === template.template_id && (
                                                <CheckCircle color="success" />
                                            )}
                                        </Stack>
                                    </Paper>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={8}>
                        <Paper elevation={2}>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    px: 3,
                                    py: 2
                                }}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    Page {currentPage} of {numPages || "-"}
                                </Typography>

                                <Stack direction="row" spacing={1}>
                                    <IconButton onClick={goPrev}>
                                        <ChevronLeft />
                                    </IconButton>
                                    <IconButton onClick={goNext}>
                                        <ChevronRight />
                                    </IconButton>
                                </Stack>
                            </Box>

                            <Divider />

                            <div className="bg-white border rounded-lg">

                                <div className="p-6 flex justify-center bg-gray-50">
                                    <canvas
                                        ref={canvasRef}
                                        className="border rounded shadow"
                                        style={{ maxWidth: "100%" }}
                                    />
                                </div>
                            </div>


                            {selectedTemplate && (
                                <Box sx={{ p: 3 }}>
                                    <Typography fontWeight={600} mb={2}>
                                        Mapped Fields
                                    </Typography>

                                    {mappedFields.map((field, index) => (
                                        <Paper key={index} sx={{ p: 1.5, mb: 1 }}>
                                            <Typography variant="body2">
                                                {field.field_type} (Page {field.page_num})
                                            </Typography>
                                        </Paper>
                                    ))}
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                <Stack direction="row" spacing={3} justifyContent="center" mt={6}>
                    <Button variant="outlined" onClick={handleSkipAll} sx={{
                            px: 6,
                            borderColor: "grey.400",
                            color: "black",
                            fontWeight:'600',
                            textTransform:'none',
                            backgroundColor:"lightgrey",
                            "&:hover": {
                                backgroundColor: "#e0e0e0"
                            }
                        }}>
                        Skip All
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleStartMapping}
                        sx={{
                            backgroundColor: "#FFB800",
                            px: 6,
                            color: "black",
                            textTransform:'none',
                            fontWeight:'600',
                            "&:hover": { backgroundColor: "#E5A600" }
                        }}
                    >
                        Start Mapping
                    </Button>
                </Stack>
            </Container>
        </Box>
    );
}
