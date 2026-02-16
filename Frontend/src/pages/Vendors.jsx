import { useEffect, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment
} from "@mui/material";

import {
  Add,
  Business,
  LocationOn,
  AttachMoney,
  Description
} from "@mui/icons-material";

import { vendors as initialVendors } from "../data/mockData";
import axios from "axios";
import { url } from "../App";

export default function Vendors() {
  const [vendorList, setVendorList] = useState(initialVendors);
  const [open, setOpen] = useState(false);

  const get_vendor_list = () => {
    axios.get(url+'vendors').then((res) => {
      setVendorList(res.data.details)
    }).catch((err) => { console.log(err) })
  }

  useEffect(() => {
    get_vendor_list();
  }, [])

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    totalAmount: "",
    invoiceCount: ""
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddVendor = () => {
    if (formData.name && formData.address) {
      const newVendor = {
        id: String(vendorList.length + 1),
        vendor_name: formData.name,
        vendor_address: formData.address,

      };

      // setVendorList([...vendorList, newVendor]);
      

      axios.post(url+"vendors",newVendor).then((res)=>{
        setFormData({
          name: "",
          address: "",
        });
        get_vendor_list();
      })
      .catch((err)=>{console.log(err)})

      setOpen(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ padding: "24px 50px 24px 50px !important" }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          //   px:'50px'
        }}
      >
        <Typography variant="h4" sx={{ color: "#002855", fontWeight: 600 }}>
          Vendors
        </Typography>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpen(true)}
          sx={{
            backgroundColor: "#FFB800",
            color: "black",
            "&:hover": { backgroundColor: "#E5A600" }
          }}
        >
          Add New Vendor
        </Button>
      </Box>

      {/* Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontSize: 22, fontWeight: 600, color: "#002855" }}>
          Add New Vendor
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Vendor Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Vendor Name *"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address *"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} variant="outlined">
            Cancel
          </Button>

          <Button
            onClick={handleAddVendor}
            variant="contained"
            sx={{
              backgroundColor: "#FFB800",
              color: "black",
              "&:hover": { backgroundColor: "#E5A600" }
            }}
          >
            Add Vendor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Table */}
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
            <TableRow>
              <TableCell>Vendor Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell align="right">Total Amount</TableCell>
              <TableCell align="center">Invoice Count</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {vendorList.map((vendor) => (
              <TableRow key={vendor.vendor_id} hover>
                <TableCell>{vendor.vendor_name}</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>
                  {vendor.vendor_address}
                </TableCell>
                <TableCell align="right">
                  ${vendor.total_amount?.toLocaleString()||0}
                </TableCell>
                <TableCell align="center">
                  {vendor.count}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
