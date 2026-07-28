--
-- PostgreSQL database dump
--

\restrict 6TdC3e2DEhd4Bpg52TiW3QZ5fa9GnUZb22Ri6uypmdiJqySjIZkBudBU89LrGsa

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employees (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    team_id integer,
    manager_id integer,
    start_date date NOT NULL,
    salary numeric(12,2) NOT NULL,
    employment_type character varying(50) NOT NULL,
    is_active integer DEFAULT 1
);


--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employees_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leave_requests (
    id integer NOT NULL,
    employee_id integer NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    days_requested integer NOT NULL,
    leave_type character varying(50) NOT NULL,
    reason text,
    status character varying(20) DEFAULT 'pending'::character varying,
    requested_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    decided_at timestamp without time zone,
    decided_by character varying(255)
);


--
-- Name: leave_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leave_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leave_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leave_requests_id_seq OWNED BY public.leave_requests.id;


--
-- Name: payroll_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payroll_runs (
    id integer NOT NULL,
    period_month integer NOT NULL,
    period_year integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: payroll_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payroll_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payroll_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payroll_runs_id_seq OWNED BY public.payroll_runs.id;


--
-- Name: payslips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payslips (
    id integer NOT NULL,
    payroll_run_id integer NOT NULL,
    employee_id integer NOT NULL,
    gross_pay numeric(12,2) NOT NULL,
    unpaid_leave_days integer DEFAULT 0,
    tax_deduction numeric(12,2) NOT NULL,
    social_security_deduction numeric(12,2) NOT NULL,
    net_pay numeric(12,2) NOT NULL
);


--
-- Name: payslips_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payslips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payslips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payslips_id_seq OWNED BY public.payslips.id;


--
-- Name: teams; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.teams (
    id integer NOT NULL,
    name character varying(255) NOT NULL
);


--
-- Name: teams_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.teams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: teams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.teams_id_seq OWNED BY public.teams.id;


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: leave_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests ALTER COLUMN id SET DEFAULT nextval('public.leave_requests_id_seq'::regclass);


--
-- Name: payroll_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_runs ALTER COLUMN id SET DEFAULT nextval('public.payroll_runs_id_seq'::regclass);


--
-- Name: payslips id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payslips ALTER COLUMN id SET DEFAULT nextval('public.payslips_id_seq'::regclass);


--
-- Name: teams id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams ALTER COLUMN id SET DEFAULT nextval('public.teams_id_seq'::regclass);


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employees (id, name, role, team_id, manager_id, start_date, salary, employment_type, is_active) FROM stdin;
1	Beatrice Gathoni	Software Developer	1	\N	2026-07-27	67999.00	full_time	1
2	Kennedy Mwangi	Trainer	2	1	2026-07-28	56999.00	full_time	1
3	Miriam Cheptoo	Intern	\N	\N	2026-07-21	15000.00	contract	1
4	Lilian Makau	Security Analyst	2	1	2026-08-14	56999.00	part_time	1
\.


--
-- Data for Name: leave_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leave_requests (id, employee_id, start_date, end_date, days_requested, leave_type, reason, status, requested_at, decided_at, decided_by) FROM stdin;
1	3	2026-07-28	2026-08-03	7	unpaid	Burial of my close relative	approved	2026-07-27 20:25:32.025477	2026-07-27 20:25:40.517429	\N
2	4	2026-07-28	2026-09-25	60	paid	For maternal leave.	approved	2026-07-27 21:08:33.665898	2026-07-27 21:08:40.495084	\N
\.


--
-- Data for Name: payroll_runs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payroll_runs (id, period_month, period_year, created_at) FROM stdin;
1	4	2026	2026-07-27 20:26:01.768818
\.


--
-- Data for Name: payslips; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payslips (id, payroll_run_id, employee_id, gross_pay, unpaid_leave_days, tax_deduction, social_security_deduction, net_pay) FROM stdin;
1	1	1	67999.00	0	9399.75	2160.00	56439.25
2	1	2	56999.00	0	6649.75	2160.00	48189.25
3	1	3	15000.00	0	0.00	900.00	14100.00
4	1	4	56999.00	0	6649.75	2160.00	48189.25
\.


--
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.teams (id, name) FROM stdin;
1	Networking Team
2	Technical Team
\.


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employees_id_seq', 4, true);


--
-- Name: leave_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leave_requests_id_seq', 2, true);


--
-- Name: payroll_runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payroll_runs_id_seq', 1, true);


--
-- Name: payslips_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payslips_id_seq', 4, true);


--
-- Name: teams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.teams_id_seq', 2, true);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: payroll_runs payroll_runs_period_month_period_year_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_runs
    ADD CONSTRAINT payroll_runs_period_month_period_year_key UNIQUE (period_month, period_year);


--
-- Name: payroll_runs payroll_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payroll_runs
    ADD CONSTRAINT payroll_runs_pkey PRIMARY KEY (id);


--
-- Name: payslips payslips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_pkey PRIMARY KEY (id);


--
-- Name: teams teams_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_name_key UNIQUE (name);


--
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- Name: employees employees_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.employees(id) ON DELETE SET NULL;


--
-- Name: employees employees_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- Name: leave_requests leave_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: payslips payslips_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;


--
-- Name: payslips payslips_payroll_run_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_payroll_run_id_fkey FOREIGN KEY (payroll_run_id) REFERENCES public.payroll_runs(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 6TdC3e2DEhd4Bpg52TiW3QZ5fa9GnUZb22Ri6uypmdiJqySjIZkBudBU89LrGsa

