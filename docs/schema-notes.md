--
-- PostgreSQL database dump
--

\restrict 6eAUekykUhDo26KMfrNYX6n0hdFqaEg74rxgRJi1lfGXoG7eOu20WxGhMfR40ay

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.6 (Ubuntu 17.6-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: core; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA core;


--
-- Name: audit_stamp_generic(); Type: FUNCTION; Schema: core; Owner: -
--

CREATE FUNCTION core.audit_stamp_generic() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.created_at IS NULL THEN NEW.created_at := CURRENT_TIMESTAMP; END IF;
    IF NEW.created_by IS NULL THEN NEW.created_by := CURRENT_USER; END IF;
    NEW.updated_at := NULL;
    NEW.updated_by := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_at := CURRENT_TIMESTAMP;
    NEW.updated_by := CURRENT_USER;
  END IF;
  RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: release_status; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.release_status (
    id smallint NOT NULL,
    code text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(100) DEFAULT CURRENT_USER,
    updated_at timestamp with time zone,
    updated_by character varying(100),
    CONSTRAINT release_status_code_check CHECK ((code ~ '^[a-z0-9_]+$'::text))
);


--
-- Name: release_status_id_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core.release_status_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: release_status_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core.release_status_id_seq OWNED BY core.release_status.id;


--
-- Name: release_type; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.release_type (
    id smallint NOT NULL,
    code text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(100) DEFAULT CURRENT_USER,
    updated_at timestamp with time zone,
    updated_by character varying(100),
    CONSTRAINT release_type_code_check CHECK ((code ~ '^[a-z0-9_]+$'::text))
);


--
-- Name: release_type_id_seq; Type: SEQUENCE; Schema: core; Owner: -
--

CREATE SEQUENCE core.release_type_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: release_type_id_seq; Type: SEQUENCE OWNED BY; Schema: core; Owner: -
--

ALTER SEQUENCE core.release_type_id_seq OWNED BY core.release_type.id;


--
-- Name: shaolin_scrolls; Type: TABLE; Schema: core; Owner: -
--

CREATE TABLE core.shaolin_scrolls (
    id bigint NOT NULL,
    major integer NOT NULL,
    minor integer NOT NULL,
    patch integer NOT NULL,
    year smallint NOT NULL,
    month smallint NOT NULL,
    label character varying(120) NOT NULL,
    release_status_id smallint NOT NULL,
    release_type_id smallint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by character varying(100) DEFAULT CURRENT_USER,
    updated_at timestamp with time zone,
    updated_by character varying(100),
    CONSTRAINT shaolin_scrolls_major_check CHECK ((major >= 0)),
    CONSTRAINT shaolin_scrolls_minor_check CHECK ((minor >= 0)),
    CONSTRAINT shaolin_scrolls_month_check CHECK (((month >= 1) AND (month <= 12))),
    CONSTRAINT shaolin_scrolls_patch_check CHECK ((patch >= 0)),
    CONSTRAINT shaolin_scrolls_year_check CHECK (((year >= 1970) AND (year <= 9999)))
);


--
-- Name: shaolin_scrolls_id_seq; Type: SEQUENCE; Schema: core; Owner: -
--

ALTER TABLE core.shaolin_scrolls ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME core.shaolin_scrolls_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: v_shaolin_scrolls; Type: VIEW; Schema: core; Owner: -
--

CREATE VIEW core.v_shaolin_scrolls AS
 SELECT s.id,
    s.major,
    s.minor,
    s.patch,
    s.year,
    s.month,
    s.label,
    rs.code AS status,
    rt.code AS release_type,
    s.created_at,
    s.created_by,
    s.updated_at,
    s.updated_by,
    ((((((((((('shaolin '::text || s.major) || '.'::text) || s.minor) || '.'::text) || s.patch) || ' – '::text) || s.year) || '-'::text) || lpad((s.month)::text, 2, '0'::text)) || ' '::text) || (
        CASE
            WHEN ((s.patch > 0) AND (POSITION(('hotfix'::text) IN (lower((s.label)::text))) = 0)) THEN (('hotfix: '::text || (s.label)::text))::character varying
            ELSE s.label
        END)::text) AS generated_name,
    ((((('v'::text || s.major) || '.'::text) || s.minor) || '.'::text) || s.patch) AS semver
   FROM ((core.shaolin_scrolls s
     JOIN core.release_status rs ON ((rs.id = s.release_status_id)))
     JOIN core.release_type rt ON ((rt.id = s.release_type_id)));


--
-- Name: release_status id; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.release_status ALTER COLUMN id SET DEFAULT nextval('core.release_status_id_seq'::regclass);


--
-- Name: release_type id; Type: DEFAULT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.release_type ALTER COLUMN id SET DEFAULT nextval('core.release_type_id_seq'::regclass);


--
-- Name: release_status release_status_code_key; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.release_status
    ADD CONSTRAINT release_status_code_key UNIQUE (code);


--
-- Name: release_status release_status_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.release_status
    ADD CONSTRAINT release_status_pkey PRIMARY KEY (id);


--
-- Name: release_type release_type_code_key; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.release_type
    ADD CONSTRAINT release_type_code_key UNIQUE (code);


--
-- Name: release_type release_type_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.release_type
    ADD CONSTRAINT release_type_pkey PRIMARY KEY (id);


--
-- Name: shaolin_scrolls shaolin_scrolls_pkey; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.shaolin_scrolls
    ADD CONSTRAINT shaolin_scrolls_pkey PRIMARY KEY (id);


--
-- Name: shaolin_scrolls uq_semver; Type: CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.shaolin_scrolls
    ADD CONSTRAINT uq_semver UNIQUE (major, minor, patch);


--
-- Name: ix_shaolin_release_type; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX ix_shaolin_release_type ON core.shaolin_scrolls USING btree (release_type_id);


--
-- Name: ix_shaolin_semver; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX ix_shaolin_semver ON core.shaolin_scrolls USING btree (major, minor, patch);


--
-- Name: ix_shaolin_status; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX ix_shaolin_status ON core.shaolin_scrolls USING btree (release_status_id);


--
-- Name: ix_shaolin_year_month; Type: INDEX; Schema: core; Owner: -
--

CREATE INDEX ix_shaolin_year_month ON core.shaolin_scrolls USING btree (year, month);


--
-- Name: release_status trg_audit_release_status; Type: TRIGGER; Schema: core; Owner: -
--

CREATE TRIGGER trg_audit_release_status BEFORE INSERT OR UPDATE ON core.release_status FOR EACH ROW EXECUTE FUNCTION core.audit_stamp_generic();


--
-- Name: release_type trg_audit_release_type; Type: TRIGGER; Schema: core; Owner: -
--

CREATE TRIGGER trg_audit_release_type BEFORE INSERT OR UPDATE ON core.release_type FOR EACH ROW EXECUTE FUNCTION core.audit_stamp_generic();


--
-- Name: shaolin_scrolls trg_audit_shaolin_scrolls; Type: TRIGGER; Schema: core; Owner: -
--

CREATE TRIGGER trg_audit_shaolin_scrolls BEFORE INSERT OR UPDATE ON core.shaolin_scrolls FOR EACH ROW EXECUTE FUNCTION core.audit_stamp_generic();


--
-- Name: shaolin_scrolls shaolin_scrolls_release_status_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.shaolin_scrolls
    ADD CONSTRAINT shaolin_scrolls_release_status_id_fkey FOREIGN KEY (release_status_id) REFERENCES core.release_status(id);


--
-- Name: shaolin_scrolls shaolin_scrolls_release_type_id_fkey; Type: FK CONSTRAINT; Schema: core; Owner: -
--

ALTER TABLE ONLY core.shaolin_scrolls
    ADD CONSTRAINT shaolin_scrolls_release_type_id_fkey FOREIGN KEY (release_type_id) REFERENCES core.release_type(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 6eAUekykUhDo26KMfrNYX6n0hdFqaEg74rxgRJi1lfGXoG7eOu20WxGhMfR40ay

