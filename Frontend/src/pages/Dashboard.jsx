import { Box, Button, Card, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PieChartJs from './PieChart';
import VerticalBarChart from './VerticalBarChart';
import VendorList from './VendorList';
import InvoiceDetails from './InvoiceDetails';
import Vendors from './Vendors';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { url } from '../App';

const Dashboard = () => {
    const [fromDate, setFromDate] = React.useState(null);
    const [toDate, setToDate] = React.useState(null);

    const [page, setPage] = useState('dashboard');

    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(false);

    let navigate = useNavigate();

    const formatDateTime = (date, isEnd = false) => {
        if (!date) return "";
        const d = new Date(date);

        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");

        const hh = isEnd ? "23" : "00";
        const min = isEnd ? "59" : "00";
        const ss = isEnd ? "59" : "00";

        return `${yyyy}/${mm}/${dd} ${hh}:${min}:${ss}`;
    };

    const get_dashboard_data = () => {
        let url1 = url+`dashboard`;

        if (fromDate && toDate) {
            const start = formatDateTime(fromDate, false);
            const end = formatDateTime(toDate, true);
            url1 += `?start_date=${start}&end_date=${end}`;
        }

        axios.get(url1).then((res) => {
            setDashboardData(res.data.details);
            setLoading(false);
        })
            .catch((err) => {
                console.log(err);
                setLoading(false);
            });
    };


    useEffect(() => {
        if (fromDate && toDate || !(fromDate && toDate)) {
            setLoading(true);
            get_dashboard_data();
        }
    }, [fromDate, toDate])

    return (
        <div style={{ background: '#F9FAFB' }}>
            <div style={{
                height: "10vh", background: "#01014e", display: 'flex', alignItems: 'center',
                paddingLeft: '50px', paddingRight: '50px', justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', height: '100%' }}>
                    <Button sx={{
                        textTransform: 'none', color: page == "dashboard" ? '#FFA700' : "white",
                        fontSize: '20px',
                        fontWeight: '600',
                        borderBottom: page == "dashboard" ? '4px solid #FFA700' : "", borderRadius: '0px', "&:focus": { outline: "none" },
                    }} onClick={() => { setPage('dashboard') }}
                    >Dashboard</Button>
                    <Button sx={{
                        textTransform: 'none', color: page == "vendors" ? '#FFA700' : "white", fontSize: '20px',
                        fontWeight: '600',
                        borderBottom: page == "vendors" ? '4px solid #FFA700' : "", borderRadius: '0px', "&:focus": { outline: "none" },
                    }} onClick={() => { setPage('vendors') }}>Vendors</Button>
                </div>
                <div>
                    <Button sx={{
                        textTransform: 'none',
                        color: 'white',
                        "&:focus": { outline: "none" },
                    }}>
                        Logout
                    </Button>
                </div>
            </div>

            {dashboardData && page == "dashboard" && <div style={{ margin: '0px 50px', }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography
                        variant="h4"
                        sx={{ color: "#002855", fontWeight: 600, mb: 2, mt: 3 }}
                    >
                        Invoice Processing Summary
                    </Typography>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <Button sx={{ textTransform: 'none', background: '#1976d2', color: 'white', fontWeight: 600 }} variant='contained'
                            onClick={() => { navigate('/extract-invoice') }}
                        >
                            Extract Invoices
                        </Button>
                        <Button sx={{ textTransform: 'none', background: '#FFA700', color: 'black', fontWeight: 600 }} variant='contained'
                            onClick={() => { navigate('/upload-invoice') }}
                        >
                            Upload Invoices
                        </Button>
                    </div>
                </div>

                <div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <DatePicker
                                    label="From (dd/mm/yyyy)"
                                    views={["year", "month", "day"]}
                                    value={fromDate}
                                    onChange={(newValue) => setFromDate(newValue)}
                                    format="DD/MM/YYYY"
                                    sx={{ maxWidth: '300px', background: 'white' }}
                                />

                                <DatePicker
                                    label="To (dd/mm/yyyy)"
                                    views={["year", "month", "day"]}
                                    value={toDate}
                                    onChange={(newValue) => setToDate(newValue)}
                                    format="DD/MM/YYYY"
                                    sx={{ maxWidth: '300px', background: 'white' }}
                                />
                            </Box>
                        </LocalizationProvider>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: '12px' }}>
                        <Card style={{ padding: '20px', width: '30%', boxShadow: "0px 1px 2px -1px #0000001A", boxShadow: "0px 1px 3px 0px #0000001A" }}>
                            <PieChartJs data={dashboardData["invoice"].filter((item) => (item.status != "Pending"))} total={dashboardData["invoice"].reduce((sum, invoice) => sum + invoice.count, 0)} />
                            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <p style={{ color: 'black', fontWeight: 600, display: 'flex', gap: "12px", margin: 0 }}>
                                    Uploaded
                                    <span style={{ color: '#1976d2' }}>{dashboardData["invoice"].reduce((sum, invoice) => sum + invoice.count, 0)}</span>
                                </p>
                                <p style={{ color: 'black', fontWeight: 600, display: 'flex', gap: "12px", margin: 0 }}>
                                    Approved
                                    <span style={{ color: '#1976d2' }}>{dashboardData["invoice"].find((item) => (item.status == "Approved"))?.count}</span>
                                </p>
                                <p style={{ color: 'black', fontWeight: 600, display: 'flex', gap: "12px", margin: 0 }}>
                                    Pending
                                    <span style={{ color: '#1976d2' }}>{dashboardData["invoice"].find((item) => (item.status == "Pending"))?.count}</span>
                                </p>
                            </div>
                        </Card>
                        <Card style={{ padding: '20px', width: '62%', boxShadow: "0px 1px 2px -1px #0000001A", boxShadow: "0px 1px 3px 0px #0000001A" }}>
                            <VerticalBarChart data={dashboardData["vendor_invoice"]} />
                        </Card>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: '30px', paddingBottom: '50px' }}>
                        <VendorList data={dashboardData["vendor_details"]} />
                        <InvoiceDetails data={dashboardData['inv_details']} />
                    </div>
                </div>
            </div>}

            {page == "vendors" && <Vendors />}
        </div>
    )
}

export default Dashboard