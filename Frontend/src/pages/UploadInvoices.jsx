import {  useState } from "react";
import { useNavigate } from "react-router";
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    Stack,
    Card
} from "@mui/material";

import axios from "axios";
import { url } from "../App";

export default function UploadInvoices() {
    const navigate = useNavigate();
    const [selectedFiles, setSelectedFiles] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files) {
            setSelectedFiles(e.target.files);
        }
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

    const handleProcess = () => {
        
        if (!selectedFiles || selectedFiles.length === 0) {
            alert("Please select a file");
            return;
        }

        const formData = new FormData();
        formData.append("upload_date", getCurrentDateTime());
        formData.append("created_by", "naraen");
        formData.append("file_name", selectedFiles[0].name);
        formData.append(selectedFiles[0].name, selectedFiles[0]);
        axios
            .post(url+"invoices", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            .then((res) => {
                console.log("Upload success", res.data);
                navigate("/template-mapping-pre", {
                    state: {
                        invoice: selectedFiles[0],
                        invoice_id: res.data.invoice_id
                    }
                });
            })
            .catch((err) => {
                console.error("Upload error", err);
            });
    };



    return (
        <Box sx={{ minHeight: "calc(100vh - 80px)", background:"#F9FAFB" }}>
            <div style={{
                width: '100%', height: "10vh", background: "#01014e", display: 'flex', alignItems: 'flex-end',
                paddingLeft: '50px'
            }}></div>
            <Container maxWidth="md" sx={{ py: 8 }}>
                <Card sx={{ p: 4 }}>
                    <Typography
                        variant="h4"
                        sx={{ color: "#002855", fontWeight: 600, mb: 2 }}
                    >
                        Upload Invoices
                    </Typography>

                    <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                        To submit the necessary invoices, select a vendor and upload the files.
                    </Typography>

                    <Stack direction="row" spacing={3} alignItems="center" mb={4}>
                        <Button
                            variant="contained"
                            component="label"
                            sx={{
                                backgroundColor: "#1976d2",
                                "&:hover": { backgroundColor: "#3A92CE" },
                                px: 4,
                                textTransform:'none',
                                fontSize:'16px'
                            }}
                        >
                            Browse
                            <input
                                type="file"
                                hidden
                                multiple
                                accept=".pdf"
                                onChange={handleFileChange}
                            />
                        </Button>

                        <Typography variant="body2" color="text.secondary">
                            Accepted file formats are (.pdf)
                        </Typography>
                    </Stack>

                    {selectedFiles && selectedFiles.length > 0 && (
                        <Paper elevation={1} sx={{ p: 2, mb: 4, bgcolor: "#f9fafb" }}>
                            <Typography variant="body2">
                                {selectedFiles.length} file(s) selected
                            </Typography>
                        </Paper>
                    )}
                </Card>

                <Stack
                    direction="row"
                    spacing={3}
                    justifyContent="center"
                    sx={{ mt: 8 }}
                >
                    <Button
                        variant="outlined"
                        onClick={() => navigate("/dashboard")}
                        sx={{
                            px: 6,
                            borderColor: "grey.400",
                            color: "black",
                            fontWeight:'600',
                            textTransform:'none',
                            backgroundColor:"lightgrey",
                            "&:hover": {
                                backgroundColor: "#e0e0e0"
                            }
                        }}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleProcess}
                        sx={{
                            px: 6,
                            backgroundColor: "#FFB800",
                            color: "black",
                            fontWeight:'600',
                            textTransform:'none',
                            "&:hover": {
                                backgroundColor: "#E5A600"
                            }
                        }}
                    >
                        Process Invoices
                    </Button>
                </Stack>

            </Container>
        </Box>
    );
}
