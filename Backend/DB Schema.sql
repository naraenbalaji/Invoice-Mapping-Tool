CREATE TABLE public.vendors
(
    vendor_id bigserial NOT NULL,
    vendor_name character varying,
    vendor_address character varying,
    PRIMARY KEY (vendor_id)
);


CREATE TABLE public.invoices
(
    id bigserial NOT NULL,
    vendor_id bigint,
    upload_date timestamp without time zone,
    status character varying,
    total_amount double precision,
    extracted_date timestamp without time zone,
    created_by character varying,
    uploaded_invoice character varying,
    CONSTRAINT vendorid FOREIGN KEY (vendor_id)
        REFERENCES public.vendors (vendor_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

CREATE TABLE public.templates
(
    id bigserial NOT NULL,
    vendor_id bigint,
    template_name character varying,
    created_at timestamp without time zone,
    created_by character varying,
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public.templates
    ADD CONSTRAINT vendorid FOREIGN KEY (vendor_id)
    REFERENCES public.vendors (vendor_id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;

CREATE TABLE public.template_fields
(
    id bigserial NOT NULL,
    template_id bigint,
    field_type character varying,
    page_num character varying,
    x double precision,
    y double precision,
    width double precision,
    height double precision,
    PRIMARY KEY (id),
    CONSTRAINT templateid FOREIGN KEY (template_id)
        REFERENCES public.templates (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

CREATE TABLE public.extracter_fields
(
    id bigserial NOT NULL,
    template_id bigint,
    invoice_number character varying,
    invoice_date timestamp without time zone,
    due_date timestamp with time zone,
    vendor_name character varying,
    vendor_address character varying,
    total_amount double precision,
    subtotal double precision,
    tax_amount double precision,
    currency character varying,
    po_number character varying,
    customer_name character varying,
    customer_address character varying,
    PRIMARY KEY (id),
    CONSTRAINT templateid FOREIGN KEY (template_id)
        REFERENCES public.templates (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
        NOT VALID
);

CREATE TABLE public.users
(
    id bigserial NOT NULL,
    name character varying,
    role character varying,
    username character varying,
    password character varying,
    PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public.extracter_fields
    ADD COLUMN invoice_id bigint;

ALTER TABLE IF EXISTS public.extracter_fields
ADD CONSTRAINT invoice_id FOREIGN KEY (invoice_id)
REFERENCES public.invoices (id) MATCH SIMPLE
ON UPDATE NO ACTION
ON DELETE NO ACTION
NOT VALID;

ALTER TABLE IF EXISTS public.template_fields
    ADD COLUMN field_datatype character varying;

ALTER TABLE IF EXISTS public.invoices
    ADD COLUMN currency character varying;

ALTER TABLE IF EXISTS public.extracter_fields
    ADD COLUMN invoice_amount double precision;


ALTER TABLE IF EXISTS public.invoices
    ADD COLUMN template_id bigint;
ALTER TABLE IF EXISTS public.invoices
    ADD CONSTRAINT templateid FOREIGN KEY (template_id)
    REFERENCES public.templates (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION
    NOT VALID;