import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";

import {
    Box,
    Container,
    Grid,
    Typography,
    Paper,
    Stack,
    Button,
    List,
    ListItemButton,
    ListItemText,
    Divider,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    CircularProgress,
    Snackbar,
    Alert
} from "@mui/material";

import {
    Description,
    Download,
    Visibility,
    AutoAwesome,
    CheckCircle,
    Cancel
} from "@mui/icons-material";
import { url } from "../App";
import axios from "axios";

export default function ExtractInvoice() {
    const navigate = useNavigate();

    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [renderedImage, setRenderedImage] = useState(null);

    const [invoice, setInvoice] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);

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

    const [invoiceDetails, setInvoiceDetails] = useState([])
    const [mappedFields, setMappedFields] = useState([]);

    function convertAPIFieldToMappedField(apiField) {
        const info = fieldTypeInfo[apiField.field_type] || { label: apiField.field_type, icon: "" };

        return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5), // unique ID
            fieldType: apiField.field_type,
            label: info.label,
            icon: info.icon,
            page: parseInt(apiField.page_num),
            left: parseFloat(apiField.x),
            top: parseFloat(apiField.y),
            width: parseFloat(apiField.width),
            height: parseFloat(apiField.height),
        };
    }

    const [selectedTemplate, setSelectedTemplate] = useState(null);


    const fetch_invoices = () => {
        axios.get(url + 'get/invoices').then((res) => {
            setInvoiceDetails(res.data.details)
        })
            .catch((err) => { console.log(err) })
    }

    useEffect(() => {
        fetch_invoices();
    }, [])

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

    const [isLoading, setIsLoading] = useState(false);

    const renderPage = async (pageNum) => {
        if (!pdfDoc) return;

        setIsLoading(true);
        const page = await pdfDoc.getPage(pageNum);

        const viewport = page.getViewport({ scale: 2.0 });

        const containerWidth = containerRef.current ? containerRef.current.offsetWidth - 448 : 800; // Subtract padding
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

        // Draw label
        context.fillStyle = colors.border;
        context.font = 'bold 12px Roboto, Arial, sans-serif';
        const textWidth = context.measureText(field.label).width;
        context.fillRect(x, y - 20, textWidth + 10, 18);
        context.fillStyle = '#ffffff';
        context.fillText(field.label, x + 5, y - 6);
    };


    useEffect(() => {
        const renderPage = async () => {
            if (!pdfDoc) return;

            const page = await pdfDoc.getPage(currentPage);
            const scale = 1;
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


    const canvasRef = useRef(null);

    const mappedInvoices = [
        { id: "1", vendorName: "Bass-Petersen", invoiceNumber: "17045625", date: "11/01/2017" },
        { id: "2", vendorName: "Davidson-Martinez", invoiceNumber: "17045626", date: "11/02/2017" },
        { id: "3", vendorName: "Tech Solutions Inc", invoiceNumber: "17045627", date: "11/03/2017" },
    ];


    useEffect(() => {
        if (selectedInvoice) {
            axios.get(url + `get/invoices/file/${selectedInvoice}`, {
                responseType: "blob",
            })
                .then((res) => {
                    const file = new Blob([res.data], { type: "application/pdf" });
                    const fileURL = URL.createObjectURL(file);
                    setInvoice(fileURL);

                })
                .catch((err) => {
                    console.log(err);
                });
            let template_id = invoiceDetails.find((item) => (item.invoice_id == selectedInvoice)).template_id

            axios.get(url + `vendors/${invoiceDetails.find((item) => (item.invoice_id == selectedInvoice)).vendor_id}/templates`).then((res) => {
                // setExistingTemplates(res.data.details)
                setSelectedTemplate(res.data.details.find((item) => (item.template_id == template_id)));
                const template = res.data.details.find(
                    (item) => item.template_id == template_id
                );

                const convertedFields = template.template_fields.map(field =>
                    convertAPIFieldToMappedField(field)
                );

                setMappedFields(convertedFields);

            }).catch((err) => { console.log(err) })

            // drawInvoice();
        }
    }, [selectedInvoice, extractedData]);

    useEffect(() => {
        if (pdfDoc && currentPage) {
            renderPage(currentPage);
        }
    }, [mappedFields]);


    const drawInvoice = async () => {
        if (!pdfDoc) return;

        const page = await pdfDoc.getPage(currentPage);
        const scale = 1.5; 
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;

        if (extractedData) {
            const regions = [
                { x: 35, y: 40, width: 180, height: 30, color: "59,130,246" },
                { x: 35, y: 70, width: 200, height: 25, color: "239,68,68" },
            ];

            regions.forEach(r => {
                ctx.strokeStyle = `rgb(${r.color})`;
                ctx.lineWidth = 2;
                ctx.strokeRect(r.x, r.y, r.width, r.height);

                ctx.fillStyle = `rgba(${r.color},0.15)`;
                ctx.fillRect(r.x, r.y, r.width, r.height);
            });
        }
    };

    const fieldTypeInfo = {
        invoice_number: { label: "Invoice Number", icon: "🔢" },
        invoice_date: { label: "Invoice Date", icon: "📅" },
        due_date: { label: "Due Date", icon: "⏰" },
        vendor_name: { label: "Vendor Name", icon: "🏢" },
        vendor_address: { label: "Vendor Address", icon: "📍" },
        total_amount: { label: "Total Amount", icon: "💰" },
        subtotal: { label: "Subtotal", icon: "💵" },
        tax_amount: { label: "Tax Amount", icon: "🧾" },
        currency: { label: "Currency", icon: "💱" },
        po_number: { label: "PO Number", icon: "📋" },
        customer_name: { label: "Customer Name", icon: "👤" },
        customer_address: { label: "Customer Address", icon: "🏠" },
    };


    const handleExtract = () => {
        setIsExtracting(true);

        axios.post(url + `invoices/${selectedInvoice}/extract`).then((res) => {
            let apiResponse = res.data.details
            const formattedData = Object.keys(apiResponse).map((key) => {
                const fieldInfo = fieldTypeInfo[key] || { label: key };

                return {
                    field: fieldInfo.label,
                    value: apiResponse[key]
                };
            });

            setExtractedData(formattedData);
            setIsExtracting(false);
        }).catch((err) => { console.log(err); setIsExtracting(false); })

    };

    const exportCSV = () => {
        if (!extractedData) return;

        const csv = [
            ["Field", "Value"],
            ...extractedData.map(r => [r.field, r.value])
        ].map(r => r.join(",")).join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "extracted_invoice_data.csv";
        a.click();
    };

    const [alertState, setAlertState] = useState({
        open: false,
        type: "success", 
        message: ""
      });

    const showAlert = (type, message) => {
        setAlertState({
          open: true,
          type,
          message
        });
      };
      
      const handleCloseAlert = () => {
        setAlertState(prev => ({ ...prev, open: false }));
      };


    const update_status = (status) => {
        axios.patch(url + `invoices/${selectedInvoice}`, {
            status: status
        }).then((res) => {
            if(status == "Approved"){
                showAlert("success", "Invoice Approved Successfully");
            }
            else{
                showAlert("error", "Invoice Rejected Successfully");
            }
        })
    }

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7fb" }}>
            <div style={{
                width: '100%', height: "10vh", background: "#01014e", display: 'flex', alignItems: 'flex-end',
                paddingLeft: '50px'
            }}></div>
            <Container maxWidth="xl" sx={{marginTop:'24px', marginLeft:'50px'}}>

                <Box mb={5}>
                    <Typography variant="h4" fontWeight={700} color="#002855">
                        Extract Invoice Data
                    </Typography>
                    <Typography color="text.secondary">
                        Select a mapped invoice and extract data
                    </Typography>
                </Box>

                <Grid container spacing={4}>

                    <Grid item xs={12} md={3}>
                        <Paper sx={{ p: 3 }}>
                            <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                                <Description color="primary" />
                                <Typography fontWeight={600}>Mapped Invoices</Typography>
                            </Stack>

                            <List>
                                {invoiceDetails.map(inv => (
                                    <ListItemButton
                                        key={inv.invoice_id}
                                        selected={selectedInvoice === inv.invoice_id}
                                        onClick={() => setSelectedInvoice(inv.invoice_id)}
                                    >
                                        <ListItemText
                                            primary={inv.vendor_name}
                                            secondary={`Invoice ${inv.invoice_id} • ${inv.upload_date}`}
                                        />
                                    </ListItemButton>
                                ))}
                            </List>
                        </Paper>

                        {selectedInvoice && !extractedData && (
                            <Button
                                fullWidth
                                sx={{ mt: 3, py: 2, bgcolor: "#FFB800", color: "black", fontSize:'18px' }}
                                onClick={handleExtract}
                                disabled={isExtracting}
                                startIcon={
                                    isExtracting
                                        ? <CircularProgress size={18} color="inherit" />
                                        : <AutoAwesome />
                                }
                            >
                                {isExtracting ? "Extracting..." : "Extract Data"}
                            </Button>
                        )}
                    </Grid>

                    <Grid item xs={12} md={9}>

                        {selectedInvoice ? (
                            <Stack spacing={3}>

                                <Paper>
                                    <Box
                                        sx={{
                                            p: 2,
                                            bgcolor: "primary.main",
                                            color: "white",
                                            display: "flex",
                                            justifyContent: "space-between"
                                        }}
                                    >
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Visibility />
                                            <Typography fontWeight={600}>Invoice Preview</Typography>
                                        </Stack>
                                        <Typography variant="body2">1 of 1</Typography>
                                    </Box>

                                    <Box p={4} display="flex" justifyContent="center">
                                        <canvas
                                            ref={canvasRef}
                                            style={{
                                                border: "1px solid #ccc",
                                                width: "100%",
                                                maxWidth: 850
                                            }}
                                        />
                                    </Box>
                                </Paper>

                                {extractedData && (
                                    <Paper>
                                        <Box
                                            sx={{
                                                p: 2,
                                                bgcolor: "success.main",
                                                color: "white",
                                                display: "flex",
                                                justifyContent: "space-between"
                                            }}
                                        >
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <CheckCircle />
                                                <Typography fontWeight={600}>
                                                    Extracted Data
                                                </Typography>
                                            </Stack>


                                        </Box>

                                        <Box p={3}>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell><b>Field</b></TableCell>
                                                        <TableCell><b>Value</b></TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {extractedData.map((row, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>{row.field}</TableCell>
                                                            <TableCell>{row.value}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>

                                            <Stack direction="row" spacing={2} mt={3}>
                                                <Button
                                                    fullWidth
                                                    color="error"
                                                    variant="contained"
                                                    startIcon={<Cancel />}
                                                    onClick={() => {
                                                        update_status("Rejected");
                                                        setExtractedData(null);
                                                        setSelectedInvoice(null);
                                                    }}
                                                >
                                                    Reject
                                                </Button>

                                                <Button
                                                    fullWidth
                                                    color="success"
                                                    variant="contained"
                                                    startIcon={<CheckCircle />}
                                                    onClick={() => {
                                                        update_status("Approved");
                                                        setExtractedData(null);
                                                        setSelectedInvoice(null);
                                                    }}
                                                >
                                                    Approve
                                                </Button>
                                            </Stack>
                                        </Box>
                                    </Paper>
                                )}

                            </Stack>
                        ) : (
                            <Paper sx={{ p: 8, textAlign: "center" }}>
                                <Description sx={{ fontSize: 60, color: "grey.400" }} />
                                <Typography variant="h6" mt={2}>
                                    Select an Invoice
                                </Typography>
                                <Typography color="text.secondary">
                                    Choose a mapped invoice to extract data
                                </Typography>
                            </Paper>
                        )}

                    </Grid>
                </Grid>
                <Snackbar
                    open={alertState.open}
                    autoHideDuration={3000}
                    onClose={handleCloseAlert}
                    anchorOrigin={{ vertical: "top", horizontal: "right" }}
                >
                    <Alert
                        onClose={handleCloseAlert}
                        severity={alertState.type}
                        variant="filled"
                        sx={{ width: "100%" }}
                    >
                        {alertState.message}
                    </Alert>
                </Snackbar>
            </Container>
        </Box>
    );
}
