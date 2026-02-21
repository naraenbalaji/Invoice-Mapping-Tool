from datetime import timedelta
import psycopg2
from datetime import datetime 
from flask import Flask,jsonify,request
from db_config import DB_CONFIG
from db_config import INVOICE_PARENT
from flask import send_file

import os
import random
import string
import fitz
import re

from supabase import create_client
import os

url = "https://lcdiarvjzwumlthwosry.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjZGlhcnZqend1bWx0aHdvc3J5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY1MDY1MywiZXhwIjoyMDg3MjI2NjUzfQ.zHOX78MqsZHkUzulnIAHUiL0q5IECAec2DMXwN8OiIE"

supabase = create_client(url, key)



app = Flask("invoice-mgt-app")
app.config["SECURITY_TOKEN"] = [{"ApiKeyAuth": ["123456789"]}]


def execute_query(query, params, fetch=False):
    conn = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        cur.execute(query, params)

        result= None

        if fetch:
            result = cur.fetchall()
        conn.commit()
        cur.close()
        return result

    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    
    finally:
        if conn:
            conn.close()


@app.route('/vendors',methods=["GET", "POST"])
def vendors():
    try:
        if request.method == "GET":
            vendor_select = """SELECT v.vendor_id, vendor_name, vendor_address, count(i.id), sum(total_amount) from vendors v LEFT JOIN invoices i ON i.vendor_id = v.vendor_id GROUP BY v.vendor_id, vendor_name, vendor_address"""
            params = ()
            result = execute_query(vendor_select, params, fetch=True)

            final_result = []
            for item in result:
                final_result.append({
                    "vendor_id":item[0],
                    "vendor_name":item[1],
                    "vendor_address":item[2],
                    "count":item[3],
                    "total_amount":item[4]
                })

            response = jsonify({"status":"Success","message":"Fetched vendors","details":final_result})
        
        elif request.method == "POST":
            vendor_name = request.json.get('vendor_name')
            vendor_address = request.json.get('vendor_address')
            vendor_post = """INSERT INTO vendors (vendor_name, vendor_address) VALUES (%s, %s) RETURNING vendor_id"""
            params = (vendor_name, vendor_address)
            result = execute_query(vendor_post, params, fetch=True)

            response = jsonify({"status":"Success", "message":"Added Vendor", "vendor_id":result[0][0]})

        else:
            raise Exception("Invalid request type")

        return response, 200

    except Exception as e:
        return jsonify({"status":"Internal Server Error"+str(e)}), 500


@app.route('/vendors/<int:vendor_id>',methods=["POST"])
def vendor_fetch(vendor_id):
    try:
        if request.method == "GET":
            vendor_select = """SELECT * from vendors WHERE vendor_id=%s"""
            params = (vendor_id,)
            result = execute_query(vendor_select, params, fetch=True)
            print(result)
            data = {
                "vendor_id":result[0][0],
                "vendor_name":result[0][1],
                "vendor_address":result[0][2]
            }
            response = jsonify({"status":"Success","message":"Fetched vendor details","details":data})

        else:
            raise Exception("Invalid request type")

        return response, 200

    except Exception as e:
        return jsonify({"status":"Internal Server Error"}), 500


@app.route('/vendors/<int:vendor_id>/templates',methods=["GET", "POST"])
def templates(vendor_id):
    try:
        if request.method == "GET":
            templates_select = """
            SELECT t.id, vendor_id, template_name, created_at, created_by,
                field_type, page_num, x, y, width, height, field_datatype
            FROM templates t
            JOIN template_fields tf ON t.id = tf.template_id WHERE vendor_id=%s
            """

            result = execute_query(templates_select, (vendor_id,), fetch=True)

            templates_dict = {}


            print(result)

            for item in result:
                template_id = item[0]

                if template_id not in templates_dict:
                    templates_dict[template_id] = {
                        "template_id": template_id,
                        "vendor_id": item[1],
                        "template_name": item[2],
                        "created_at": item[3],
                        "created_by": item[4],
                        "template_fields": []
                    }

                templates_dict[template_id]["template_fields"].append({
                    "field_type": item[5],
                    "page_num": item[6],
                    "x": item[7],
                    "y": item[8],
                    "width": item[9],
                    "height": item[10],
                    "field_datatype": item[11]
                })

            final_result = list(templates_dict.values())

            response = jsonify({
                "status": "Success",
                "message": "Fetched template details",
                "details": final_result
            })

        elif request.method == "POST":
            template_name = request.json.get('template_name')
            created_at = request.json.get('created_at')
            created_by = request.json.get('created_by')
            invoice_id = request.json.get('invoice_id')
            templates_post = """INSERT INTO templates (vendor_id, template_name, created_at, created_by) VALUES 
            (%s, %s, %s, %s) RETURNING id"""

            params = (vendor_id, template_name, created_at, created_by)

            result = execute_query(templates_post, params, fetch=True)

            invoice_update = """UPDATE invoices SET template_id=%s WHERE id=%s"""
            inv_params = (result[0][0], invoice_id)

            execute_query(invoice_update, inv_params)

            response = jsonify({"status":"Success","message":"Created a new template","template_id":result[0][0]})


        else:
            raise Exception("Invalid request type")

        return response, 200

    except Exception as e:
        return jsonify({"status":"Internal Server Error"+str(e)}), 500

@app.route('/templates',methods=["GET"])
def templates_get():
    try:
        if request.method == "GET":
            templates_select = """
            SELECT t.id, vendor_id, template_name, created_at, created_by,
                field_type, page_num, x, y, width, height, field_datatype
            FROM templates t
            JOIN template_fields tf ON t.id = tf.template_id
            """

            result = execute_query(templates_select, (), fetch=True)

            templates_dict = {}

            for item in result:
                template_id = item[0]

                if template_id not in templates_dict:
                    templates_dict[template_id] = {
                        "template_id": template_id,
                        "vendor_id": item[1],
                        "template_name": item[2],
                        "created_at": item[3],
                        "created_by": item[4],
                        "template_fields": []
                    }

                templates_dict[template_id]["template_fields"].append({
                    "field_type": item[5],
                    "page_num": item[6],
                    "x": item[7],
                    "y": item[8],
                    "width": item[9],
                    "height": item[10],
                    "field_datatype": item[11]
                })

            final_result = list(templates_dict.values())

            response = jsonify({
                "status": "Success",
                "message": "Fetched template details",
                "details": final_result
            })


        else:
            raise Exception("Invalid request type")

        return response, 200

    except Exception as e:
        return jsonify({"status":"Internal Server Error"}), 500

@app.route('/templates/<int:template_id>',methods=["GET"])
def template_fetch(template_id):
    try:
        if request.method == "GET":
            template_select = """SELECT * from templates WHERE id=%s"""
            params = (template_id,)
            result = execute_query(template_select, params, fetch=True)
            print(result)
            data = {
                "template_id":result[0][0],
                "vendor_id":result[0][1],
                "template_name":result[0][2],
                "created_at":result[0][3],
                "created_by":result[0][4]
            }
            response = jsonify({"status":"Success","message":"Fetched template details","details":data})

        else:
            raise Exception("Invalid request type")

        return response, 200

    except Exception as e:
        return jsonify({"status":"Internal Server Error"}), 500

@app.route('/templates/<int:template_id>/fields', methods=["POST"])
def template_field_insert(template_id):
    try:
        inputs = request.json

        if not inputs or "fields" not in inputs:
            return jsonify({
                "status": "Failed",
                "message": "fields key missing"
            }), 400

        fields = inputs.get("fields")

        if not isinstance(fields, list):
            return jsonify({
                "status": "Failed",
                "message": "fields must be an array"
            }), 400


        insert_query = """
            INSERT INTO template_fields(
                template_id, field_type, page_num, x, y, width, height, field_datatype
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = []
        for field in fields:
            values.append((
                template_id,
                field.get('field_type'),
                field.get('page_num'),
                field.get('x'),
                field.get('y'),
                field.get('width'),
                field.get('height'),
                field.get('field_datatype')
            ))

        for val in values:
            execute_query(insert_query, val)


        return jsonify({
            "status": "Success",
            "message": "Template fields created successfully"
        }), 200

    except Exception as e:
        return jsonify({
            "status": "Internal Server Error",
            "error": str(e)
        }), 500


def field_extraction():
            invoice_number = inputs.get('invoice_number')
            invoice_date = inputs.get('invoice_date')
            due_date = inputs.get('due_date')
            vendor_name = inputs.get('vendor_name')
            vendor_address = inputs.get('vendor_address')
            total_amount = inputs.get('total_amount')
            subtotal = inputs.get('subtotal')
            tax_amount = inputs.get('tax_amount')
            currency = inputs.get('currency')
            po_number = inputs.get('po_number')
            customer_name = inputs.get('customer_name')
            customer_address = inputs.get('customer_address')

            template_field_insert = """INSERT INTO template_fields(
                                        template_id, field_type, page_num, x, y, width, height)
                                        VALUES ( %s, %s, %s, %s, %s, %s, %s)"""
            template_params = (template_id, field_type, page_num, x, y, width, height)

            extracter_insert = """ INSERT INTO extracter_fields(
                                    template_id, invoice_number, invoice_date, due_date, vendor_name, vendor_address, 
                                    total_amount, sub_total, tax_amount, currency, po_number, customer_name, customer_address)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"""
            extracter_params = (template_id, invoice_number, invoice_date, due_date, vendor_name, vendor_address, 
                                    total_amount, subtotal, tax_amount, currency, po_number, customer_name, customer_address)

            execute_query(extracter_insert, extracter_params)


@app.route('/invoices', methods=["POST", "GET"])
def invoices():
    try:
        if request.method == "POST":
            inputs = request.form
            vendor_id = inputs.get('vendor_id')
            upload_date = inputs.get('upload_date')
            total_amount = inputs.get('total_amount')
            extracted_date = inputs.get('extracted_date')
            created_by = inputs.get('created_by')
            file_name = inputs.get('file_name')
            files = request.files.get(file_name)

            if not files:
                return jsonify({"status":"Failed","meassage":"File not provided"}), 400
            
            file_path = f"{files.filename}"

            try:
                file_bytes = files.read()

                print(key[:10])

                supabase.storage.from_("pdf-files").upload(
                    file_path,
                    file_bytes,
                    {"content-type": "application/pdf"}
                )

                public_url = supabase.storage.from_("pdf-files").get_public_url(file_path)

            except Exception as e:
                raise e

            invoice_post = """INSERT INTO invoices(
                                vendor_id, upload_date, status, total_amount, extracted_date, created_by, uploaded_invoice)
                                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id"""
            params = (vendor_id, upload_date, "Pending", total_amount, extracted_date, created_by, public_url)

            result = execute_query(invoice_post, params, fetch=True)

            response = jsonify({"status":"Success","message":"Uploaded invoice", "invoice_id":result[0][0]})
        
        elif request.method=="GET":
            filters = request.args
            vendor_name = filters.get('vendor_name')
            start_date = filters.get('start_date')
            end_date = filters.get('end_date')
            status = filters.get('status')


            select_invoice = """SELECT * FROM invoices i LEFT JOIN vendors v on v.vendor_id = i.vendor_id WHERE 1=1 """
            params = []

            if vendor_name:
                select_invoice += " AND vendor_name ILIKE %s"
                params.append(f"%{vendor_name}%")

            if start_date and end_date:
                select_invoice += " AND upload_date BETWEEN %s AND %s"
                params.append(start_date)
                params.append(end_date)

                print(select_invoice)

            if status:
                select_invoice += " AND status = %s"
                params.append(status)
        
            select_invoice += " ORDER BY upload_date DESC"

            invoices = execute_query(select_invoice, tuple(params), fetch=True)

            invoice_list = []
            for invoice in invoices:
                file_name = invoice[7].split('/')
                file_name = file_name[len(file_name)-1]
                invoice_list.append({
                    "invoice_id":invoice[0],
                    "vendor_id":invoice[1],
                    "upload_date":invoice[2],
                    "status":invoice[3],
                    "total_amount":invoice[4],
                    "extracted_date":invoice[5],
                    "created_by":invoice[6],
                    "file_name":file_name
                })

            response = jsonify({'status':"Success","message":"Fetched invoices","details":invoice_list})

        else:
            raise Exception("Invalid request type")

        return response, 200

    except Exception as e:
        return jsonify({"status":"Internal Server Error","error":str(e)}), 500


@app.route('/invoices/<int:invoice_id>', methods=[ "GET"])
def invoices_get(invoice_id):
    try:
        if request.method=="GET":
            
            extracter_select = """SELECT template_id, invoice_number, invoice_date, due_date, vendor_name, 
                                    vendor_address, total_amount, sub_total, tax_amount, currency, po_number, customer_name, 
                                    customer_address, invoice_id, invoice_amount FROM extracter_fields WHERE invoice_id=%s"""
            
            params = (invoice_id,)

            result = execute_query(extracter_select, params, fetch=True)

            final_result = {
                "template_id":result[0][0],
                "invoice_number":result[0][1],
                "invoice_date":result[0][2],
                "due_date":result[0][3],
                "vendor_name":result[0][4],
                "vendor_address":result[0][5],
                "total_amount":result[0][6],
                "sub_total":result[0][7],
                "tax_amount":result[0][8],
                "currency":result[0][9],
                "po_number":result[0][10],
                "customer_name":result[0][11],
                "customer_address":result[0][12],
                "invoice_id":result[0][13],
                "invoice_amount":result[0][14],
            }

            response = jsonify({'status':"Success","message":"Fetched invoices extracted details","details":final_result})

        else:
            raise Exception("Invalid request type")

        return response, 200

    except Exception as e:
        return jsonify({"status":"Internal Server Error","error":str(e)}), 500

@app.route('/get/invoices', methods=['GET'])
def get_invoices():
    try:
        if request.method == 'GET':
            qFetch = """SELECT v.vendor_id, v.vendor_name, i.id, i.upload_date, i.template_id FROM
                    vendors v JOIN invoices i ON i.vendor_id = v.vendor_id
                    JOIN templates t ON i.template_id = t.id
            """
            params = () 
            result = execute_query(qFetch, params, fetch=True)

            final_result = []
            for item in result:
                final_result.append({
                    "vendor_id":item[0],
                    "vendor_name":item[1],
                    "invoice_id":item[2],
                    "upload_date":item[3],
                    "template_id":item[4]
                })
            response = jsonify({'status':"Success","message":"Fetched invoices details","details":final_result})
        else:
                raise Exception("Invalid request type")

        return response, 200

    except Exception as e:
        return jsonify({"status":"Internal Server Error","error":str(e)}), 500
    
@app.route('/get/invoices/file/<int:invoice_id>', methods=['GET'])
def get_invoices_file(invoice_id):
    try:
        qFetch = """SELECT uploaded_invoice FROM invoices WHERE id=%s"""
        params = (invoice_id,)
        result = execute_query(qFetch, params, fetch=True)

        if not result:
            return jsonify({
                "status": "Failed",
                "message": "Invoice not found"
            }), 404

        file_path = result[0][0]   # Example: "invoice_123.pdf"

        if not file_path:
            return jsonify({
                "status": "Failed",
                "message": "File path not stored"
            }), 404

        # Download file from Supabase Storage
        file_bytes = supabase.storage.from_("pdf-files").download(file_path)

        if not file_bytes:
            return jsonify({
                "status": "Failed",
                "message": "File not found in storage"
            }), 404

        return send_file(
            io.BytesIO(file_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=file_path
        )

    except Exception as e:
        return jsonify({
            "status": "Internal Server Error",
            "error": str(e)
        }), 500

def clean_double_field(value):
    if not value:
        return None

    currency_symbols = ["$", "€", "£", "₹", "¥", "₽"]
    for symbol in currency_symbols:
        value = value.replace(symbol, "")

    value = value.replace(",", "")

    value = re.sub(r"[^0-9.\-]", "", value)

    if value.count(".") > 1:
        first, *rest = value.split(".")
        value = first + "." + "".join(rest)

    if value.count("-") > 1:
        value = "-" + value.replace("-", "")

    if value in ("", ".", "-"):
        return None

    try:
        return float(value)
    except:
        return None



@app.route('/invoices/<int:invoice_id>/extract', methods=["POST"])
def invoices_extract(invoice_id):
    try:
        if request.method=="POST":
            
            select_invoice = """SELECT uploaded_invoice, template_id FROM invoices WHERE id=%s"""
            params = (invoice_id,)

            result = execute_query(select_invoice, params, fetch=True)
            file_path = result[0][0]
            template_id = result[0][1]

            doc = fitz.open(file_path)

            fetch_template_fields = """SELECT tf.template_id, field_type, page_num, x, y, width, height, field_datatype, i.id FROM template_fields tf
            JOIN templates t ON t.id = tf.template_id 
            JOIN invoices i ON t.id = i.template_id
            WHERE tf.template_id=%s AND i.id=%s
            """
            template_params = (template_id,invoice_id)

            template_fields = execute_query(fetch_template_fields, template_params, fetch=True)

            print(template_fields)

            extracted_data = {}

            for field in template_fields:
                page = doc[int(field[2])-1]
                page_width = page.rect.width
                page_height = page.rect.height

                x1 = (field[3] / 100) * page_width
                y1 = (field[4] / 100) * page_height
                x2 = x1 + (field[5] / 100) * page_width
                y2 = y1 + (field[6] / 100) * page_height

                rect = fitz.Rect(x1,y1,x2,y2)

                text = page.get_text("text",clip=rect)

                text = text.replace("\n","")



                if field[7] == "double":
                    finaltext = clean_double_field(text)
                    extracted_data[field[1]] = finaltext
                else:
                    extracted_data[field[1]] = text
                
                print(extracted_data[field[1]])


            fetch_extracter = """SELECT * FROM extracter_fields WHERE invoice_id=%s"""
            extarcter_params = (invoice_id,)

            current_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            

            res = execute_query(fetch_extracter, extarcter_params, fetch=True)
            extracted_data = {
                k: v for k, v in extracted_data.items()
                if v not in (None, "", [])
            }

            print(res)
            print(extracted_data)

            if not extracted_data:
                return jsonify({
                    "status": "Success",
                    "message": "No valid extracted data to store"
                }), 200

            if len(res) == 0:
                columns = ", ".join(list(extracted_data.keys()) + ["invoice_id"])
                placeholders = ", ".join(["%s"] * (len(extracted_data) + 1))

                insert_query = f"""INSERT INTO extracter_fields ({columns}) VALUES ({placeholders})
                """

                params = tuple(list(extracted_data.values()) + [invoice_id])

                execute_query(insert_query, params)

                update_fields = {"extracted_date": current_date}

                if "total_amount" in extracted_data:
                    update_fields["total_amount"] = extracted_data["total_amount"]

                if "currency" in extracted_data:
                    update_fields["currency"] = extracted_data["currency"]

                set_clause = ", ".join([f"{key}=%s" for key in update_fields.keys()])
                update_invoice = f""" UPDATE invoices SET {set_clause} WHERE id=%s"""

                inv_params = list(update_fields.values()) + [invoice_id]

                execute_query(update_invoice, inv_params)

            else:
                set_clause = ", ".join([f"{col} = %s" for col in extracted_data.keys()])

                update_query = f"UPDATE extracter_fields SET {set_clause} WHERE invoice_id={invoice_id}"
                execute_query(update_query, tuple(extracted_data.values()))

                update_fields = {"extracted_date": current_date}

                if "total_amount" in extracted_data:
                    update_fields["total_amount"] = extracted_data["total_amount"]

                if "currency" in extracted_data:
                    update_fields["currency"] = extracted_data["currency"]

                set_clause = ", ".join([f"{key}=%s" for key in update_fields.keys()])
                update_invoice = f"UPDATE invoices SET {set_clause} WHERE id=%s"

                inv_params = list(update_fields.values()) + [invoice_id]

                execute_query(update_invoice, inv_params)

            response = jsonify({'status':"Success","message":"Extracted Details from Invoice","details":extracted_data})

        else:
            raise Exception("Invalid request type")

        return response, 200

    except Exception as e:
        return jsonify({"status":"Internal Server Error","error":str(e)}), 500


@app.route("/invoices/<int:invoice_id>", methods=["PATCH"])
def patch_invoice(invoice_id):
    try:
        if request.method == "PATCH":
            inputs = request.json
            status = inputs.get('status')

            update_query = """UPDATE invoices SET status=%s WHERE id=%s"""
            update_params = (status, invoice_id)

            execute_query(update_query, update_params)

            response = jsonify({'status':"Success","message":"Updated invoice details"})

        else:
            raise Exception("Invalid request type")

        return response, 200

    except Exception as e:
        return jsonify({"status":"Internal Server Error","error":str(e)}), 500

@app.route("/invoices/<int:invoice_id>/<int:vendor_id>", methods=["PATCH"])
def patch_invoice_vendor(invoice_id, vendor_id):
    try:
        if request.method == "PATCH":
            update_query = """UPDATE invoices SET vendor_id=%s WHERE id=%s"""
            update_params = (vendor_id, invoice_id)

            execute_query(update_query, update_params)

            response = jsonify({'status':"Success","message":"Updated invoice details"})

        else:
            raise Exception("Invalid request type")

        return response, 200

    except Exception as e:
        return jsonify({"status":"Internal Server Error","error":str(e)}), 500

@app.route("/dashboard",methods=["GET"])
def dashboard():
    try:
        if request.method=="GET":
            inputs = request.args
            start_date = inputs.get('start_date')
            end_date = inputs.get('end_date')

            params = ()
            date_filter = ""
            if start_date and end_date:
                date_filter = "WHERE upload_date BETWEEN %s AND %s"
                params = (start_date, end_date)

            select_vendor_invoice = f"""SELECT v.vendor_id, vendor_name, count(*) FROM invoices i
            JOIN vendors v ON i.vendor_id = v.vendor_id {date_filter} GROUP BY 1,2
            """

            select_vendor_details = f"""
            SELECT v.vendor_id, vendor_name, vendor_address, sum(total_amount), currency FROM invoices i
            RIGHT JOIN vendors v ON i.vendor_id = v.vendor_id {date_filter} GROUP BY 1,2,3,5
            """

            select_invoice = f"""SELECT count(*), status FROM invoices {date_filter} GROUP BY 2"""

            select_inv_details = f"""SELECT i.id AS invoice_id, ef.invoice_date, ef.invoice_number, ef.invoice_amount,
                                ef.tax_amount, ef.total_amount, ef.currency, i.status FROM invoices i
                                LEFT JOIN extracter_fields ef ON i.id = ef.invoice_id {date_filter}
                                """

            vendor_invoice = execute_query(select_vendor_invoice, params, fetch=True)
            vendor_details = execute_query(select_vendor_details, params, fetch=True)
            invoice = execute_query(select_invoice, params, fetch=True)
            inv_details = execute_query(select_inv_details, params, fetch=True)


            vendor_inv_graph = []
            vendor_details_list = []
            invoice_list = []
            inv_details_list=[]
            for item in vendor_invoice:
                vendor_inv_graph.append({
                    "vendor_id":item[0],
                    "vendor_name":item[1],
                    "count":item[2],
                })
            
            for item in vendor_details:
                vendor_details_list.append({
                    "vendor_id":item[0],
                    "vendor_name":item[1],
                    "vendor_address":item[2],
                    "total_amount":item[3],
                    "currency":item[4]
                })

            for item in invoice:
                invoice_list.append({
                    "count":item[0],
                    "status":item[1]
                })

            for item in inv_details:
                inv_details_list.append({
                    "invoice_id": item[0],
                    "invoice_date": item[1],
                    "invoice_number": item[2],
                    "invoice_amount": item[3],
                    "tax_amount": item[4],
                    "total_amount": item[5],
                    "currency": item[6],
                    "status": item[7]
                })

            response = jsonify({"status":"Success","message":"Fetched Details","details":{
                "vendor_invoice":vendor_inv_graph,
                "vendor_details":vendor_details_list,
                "invoice":invoice_list,
                "inv_details":inv_details_list
            }})

            return response
        else:
            raise Exception("Invalid request method")
    except Exception as e:
        return jsonify({"status":"Internal Server Error","error":str(e)}), 500


if __name__ == '__main__':
    app.run(host ="0.0.0.0", port = 5001, debug = True)
