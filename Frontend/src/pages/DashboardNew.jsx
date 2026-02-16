import { useState } from "react";
import { useNavigate } from "react-router";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import DownloadIcon from "@mui/icons-material/Download";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { invoices, vendors, vendorChartData } from "../data/mockData";

export default function DashboardNew() {
  const navigate = useNavigate();

  const [fromDate, setFromDate] = useState("23/05/2022");
  const [toDate, setToDate] = useState("30/05/2022");
  const [selectedFilter, setSelectedFilter] = useState("accepted");

  const acceptedCount = invoices.filter(
    (i) => i.status === "accepted"
  ).length;
  const rejectedCount = invoices.filter(
    (i) => i.status === "rejected"
  ).length;
  const totalCount = invoices.length;

  const acceptedPercentage = Math.round(
    (acceptedCount / totalCount) * 100
  );

  const pieData = [
    { name: "Accepted", value: acceptedCount },
    { name: "Rejected", value: rejectedCount },
  ];

  const filteredInvoices = invoices.filter(
    (inv) => inv.status === selectedFilter
  );

  return (
    <Box maxWidth={1400} mx="auto" p={4}>
      <Box display="flex" justifyContent="space-between" mb={4}>
        <Typography variant="h4" color="#002855">
          Invoice Processing Summary
        </Typography>

        <Button
          variant="contained"
          sx={{ bgcolor: "#FFB800", color: "black" }}
          onClick={() => navigate("/upload")}
        >
          Upload Invoices
        </Button>
      </Box>

      <Box display="flex" gap={2} mb={4}>
        <TextField
          label="From"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <TextField
          label="To"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
      </Box>

      <Grid container spacing={4} mb={6}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={80}
                    outerRadius={120}
                    dataKey="value"
                  >
                    <Cell fill="#002855" />
                    <Cell fill="#FF6B47" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              <Box textAlign="center" mt={2}>
                <Typography variant="h3" color="#4AA3DF">
                  {totalCount}
                </Typography>
                <Typography color="#4AA3DF">
                  files uploaded
                </Typography>
              </Box>

              <Box display="flex" justifyContent="center" gap={4} mt={2}>
                <Typography>Uploaded: {totalCount}</Typography>
                <Typography>Approved: {acceptedCount}</Typography>
                <Typography>Rejected: {rejectedCount}</Typography>
              </Box>

              <Typography textAlign="center" mt={2} variant="h5">
                {acceptedPercentage}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="#4AA3DF" mb={2}>
                Comparison of Vendors and Invoices Processed
              </Typography>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={vendorChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4AA3DF" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="#4AA3DF" mb={2}>
                Vendors List
              </Typography>

              {vendors.slice(0, 6).map((vendor) => (
                <Box
                  key={vendor.id}
                  borderBottom="1px solid #eee"
                  pb={2}
                  mb={2}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                  >
                    <Typography fontWeight={500}>
                      {vendor.name}
                    </Typography>
                    <Typography>xx,xxx</Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {vendor.address}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                mb={2}
              >
                <Typography variant="h6" color="#4AA3DF">
                  Invoice Details
                </Typography>

                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  size="small"
                >
                  Download Excel
                </Button>
              </Box>

              <RadioGroup
                row
                value={selectedFilter}
                onChange={(e) =>
                  setSelectedFilter(e.target.value)
                }
              >
                <FormControlLabel
                  value="accepted"
                  control={<Radio />}
                  label="Accepted"
                />
                <FormControlLabel
                  value="rejected"
                  control={<Radio />}
                  label="Rejected"
                />
              </RadioGroup>

              <Table size="small">
                <TableHead sx={{ bgcolor: "#4AA3DF" }}>
                  <TableRow>
                    <TableCell sx={{ color: "white" }}>
                      Invoice Date
                    </TableCell>
                    <TableCell sx={{ color: "white" }}>
                      Invoice Number
                    </TableCell>
                    <TableCell align="right" sx={{ color: "white" }}>
                      Invoice Amount
                    </TableCell>
                    <TableCell align="right" sx={{ color: "white" }}>
                      Tax Amount
                    </TableCell>
                    <TableCell align="right" sx={{ color: "white" }}>
                      Total Amount
                    </TableCell>
                    <TableCell sx={{ color: "white" }}>
                      Payment Terms
                    </TableCell>
                    <TableCell align="center" sx={{ color: "white" }}>
                      Currency
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        {invoice.invoiceDate}
                      </TableCell>
                      <TableCell>
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell align="right">
                        Xxxx
                      </TableCell>
                      <TableCell align="right">
                        Xxxx
                      </TableCell>
                      <TableCell align="right">
                        Xxxx
                      </TableCell>
                      <TableCell>
                        {invoice.paymentTerms}
                      </TableCell>
                      <TableCell align="center">
                        {invoice.currency}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
