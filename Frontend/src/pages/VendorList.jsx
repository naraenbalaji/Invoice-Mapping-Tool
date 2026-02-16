// VendorList.jsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, Typography } from "@mui/material";

const VendorList = ({ data }) => {
    const [expandedVendorId, setExpandedVendorId] = useState(null);

    const handleToggle = (id) => {
        setExpandedVendorId(expandedVendorId === id ? null : id);
    };

    const filteredVendors = Object.values(
        data.reduce((acc, vendor) => {
          const key = vendor.vendor_id;
      
          if (!acc[key]) {
            acc[key] = vendor;
          } 
          else if (!acc[key].currency && vendor.currency) {
            acc[key] = vendor;
          }
      
          return acc;
        }, {})
      );
      

    return (
        <div style={{ width: "33%", maxWidth: "600px", minWidth: "400px" }}>
            <Card sx={{ padding: '20px', boxShadow: "0px 1px 2px -1px #0000001A", boxShadow: "0px 1px 3px 0px #0000001A" }}>
                <Typography
                    component="h3"
                    color="#1976d2"
                    sx={{ width: "max-content", maxWidth: "600px", fontWeight: 600, mb: 2 }}
                >
                    Vendor List
                </Typography>


                {/* Vendor Cards */}
                {filteredVendors.map((vendor) => (
                    <Card
                        key={vendor.vendor_id}
                        sx={{
                            borderRadius: "12px",
                            border: "1px solid #1976d2",
                            mb: 2,
                            cursor: "pointer",
                        }}
                        onClick={() => handleToggle(vendor.vendor_id)}
                    >
                        <CardHeader
                            title={
                                <div
                                    style={{ display: "flex", justifyContent: "space-between" }}
                                >
                                    <Typography
                                        variant="h6"
                                        component="div"
                                        sx={{
                                            color: expandedVendorId === vendor.vendor_id ? "white" : "black",
                                            fontSize: "16px",
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        {vendor.vendor_name}
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        component="div"
                                        sx={{
                                            color: expandedVendorId === vendor.vendor_id ? "white" : "black",
                                            fontSize: "16px",
                                            display: "flex",
                                            alignItems: "center",
                                        }}
                                    >
                                        {vendor.currency}{vendor.total_amount || "-"}
                                    </Typography>
                                </div>
                            }
                            sx={{
                                backgroundColor: expandedVendorId === vendor.vendor_id ? "#1976d2" : "white",
                                display: "flex",
                                alignItems: "center",
                                padding: "12px",
                            }}
                        />

                        {/* Show address only if this vendor is expanded */}
                        {expandedVendorId === vendor.vendor_id && (
                            <CardContent sx={{ fontSize: "14px", padding: "12px" }}>
                                {vendor.vendor_address}
                            </CardContent>
                        )}
                    </Card>
                ))}
            </Card>
        </div>
    );
};

export default VendorList;
