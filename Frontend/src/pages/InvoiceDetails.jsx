import React, { useState, useMemo } from 'react';
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  TablePagination,
  Card,
} from '@mui/material';

const InvoiceDetails = ({ data }) => {
  const [statusFilter, setStatusFilter] = useState("Approved");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // Filter invoices based on status using useMemo to prevent unnecessary recalculations
  const filteredInvoices = useMemo(() => {
    return data.filter((invoice) => invoice.status === statusFilter);
  }, [data, statusFilter]);

  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div style={{ width: '65%', minWidth: '400px' }}>
      <Card sx={{ padding: '20px', boxShadow: "0px 1px 2px -1px #0000001A", boxShadow: "0px 1px 3px 0px #0000001A" }}>
        <Typography
          component="h3"
          color="#1976d2"
          sx={{ width: 'max-content', maxWidth: '600px', fontWeight: 600 }}
        >
          Invoice Details
        </Typography>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
          <FormControl>
            <RadioGroup
              row
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <FormControlLabel value="Approved" control={<Radio color="success" />} label="Approved" sx={{ color: 'black' }} />
              <FormControlLabel value="Rejected" control={<Radio color="error" />} label="Rejected" sx={{ color: 'red' }} />
            </RadioGroup>
          </FormControl>
          <Button sx={{ textTransform: 'none', fontWeight: 600 }}>
            Download Excel
          </Button>
        </div>

        <TableContainer component={Paper} sx={{ mt: 1 }}>
          <Table>
            <TableHead sx={{ background: '#1976d2' }}>
              <TableRow>
              <TableCell sx={{ color: 'white' }}>Invoice ID</TableCell>
                <TableCell sx={{ color: 'white' }}>Invoice Date</TableCell>
                <TableCell sx={{ color: 'white' }}>Invoice Number</TableCell>
                <TableCell sx={{ color: 'white' }} align="left">Invoice Amount</TableCell>
                <TableCell sx={{ color: 'white' }} align="left">Tax Amount</TableCell>
                <TableCell sx={{ color: 'white' }} align="left">Total Amount</TableCell>
                <TableCell sx={{ color: 'white' }}>Currency</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((invoice, index) => (
                  <TableRow key={`${invoice.invoice_number}-${index}`}>       
                  <TableCell>{invoice.invoice_id}</TableCell>         
                    <TableCell>{invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString("en-GB") : "-"}</TableCell>
                    <TableCell>{invoice.invoice_number}</TableCell>
                    <TableCell align="left">{invoice.invoice_amount}</TableCell>
                    <TableCell align="left">{invoice.tax_amount}</TableCell>
                    <TableCell align="left">{invoice.total_amount}</TableCell>
                    <TableCell>{invoice.currency}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredInvoices.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
          />
        </TableContainer>
      </Card>
    </div>
  );
};

export default InvoiceDetails;
