import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
export const pool = new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL.includes('localhost')?false:{rejectUnauthorized:false},max:10,idleTimeoutMillis:30000,connectionTimeoutMillis:10000});
export async function initDatabase(){
 await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;
 CREATE TABLE IF NOT EXISTS admin_users(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text UNIQUE NOT NULL,password_hash text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS cms_entries(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),type text NOT NULL CHECK(type IN ('pricing','services','projects','faqs','blog-posts','settings')),data jsonb NOT NULL DEFAULT '{}'::jsonb,is_published boolean NOT NULL DEFAULT true,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
 CREATE INDEX IF NOT EXISTS cms_entries_type_idx ON cms_entries(type,created_at DESC);
 CREATE TABLE IF NOT EXISTS contact_messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text NOT NULL,email text NOT NULL,organisation text NOT NULL DEFAULT '',service text NOT NULL DEFAULT '',message text NOT NULL,status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','read','responded','archived')),created_at timestamptz NOT NULL DEFAULT now());
 CREATE INDEX IF NOT EXISTS contact_messages_created_idx ON contact_messages(created_at DESC);
 CREATE TABLE IF NOT EXISTS subscriptions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),email text UNIQUE NOT NULL,status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','unsubscribed')),created_at timestamptz NOT NULL DEFAULT now());
 CREATE TABLE IF NOT EXISTS email_messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),external_id text UNIQUE,from_name text NOT NULL DEFAULT '',from_email text NOT NULL,subject text NOT NULL DEFAULT '',message text NOT NULL,received_at timestamptz NOT NULL DEFAULT now(),status text NOT NULL DEFAULT 'unread' CHECK(status IN ('unread','read','replied','archived')),created_at timestamptz NOT NULL DEFAULT now());
 CREATE INDEX IF NOT EXISTS email_messages_received_idx ON email_messages(received_at DESC);
 CREATE TABLE IF NOT EXISTS app_meta(key text PRIMARY KEY,value jsonb NOT NULL DEFAULT '{}'::jsonb);`);
 if(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD){const hash=await bcrypt.hash(process.env.ADMIN_PASSWORD,12);await pool.query('INSERT INTO admin_users(email,password_hash) VALUES($1,$2) ON CONFLICT(email) DO NOTHING',[process.env.ADMIN_EMAIL.toLowerCase(),hash]);}
 const bootstrap=await pool.query("INSERT INTO app_meta(key,value) VALUES('starter_content_v1','{}'::jsonb) ON CONFLICT(key) DO NOTHING RETURNING key");
 if(bootstrap.rowCount){
  const starter={
   services:[
    {slug:'software-web-development',title:'Software & Web Development',label:'Build',summary:'Websites, applications and custom software shaped around the way your organisation works.',detail:'We plan, design and build digital products that make your services easier to find and use.',bullets:['Business and institutional websites','Custom web and mobile applications','User experience (UX) and system updates']},
    {slug:'digital-marketing-branding',title:'Digital Marketing & Branding',label:'Reach',summary:'A clearer digital presence that helps the right people discover and remember your organisation.',detail:'Build a consistent brand experience across the channels your customers use.',bullets:['Search engine optimisation','Social media and content marketing','Paid campaigns and brand identity']},
    {slug:'business-automation-ai',title:'Business Automation & AI',label:'Simplify',summary:'Less repetitive work and more time for the work that needs human attention.',detail:'Connect business tools and automate repeatable processes with human oversight.',bullets:['Workflow and task automation','CRM and ERP integrations','AI-enabled business tools']},
    {slug:'it-consulting-strategy',title:'IT Consulting & Strategy',label:'Plan',summary:'Make considered technology decisions with an experienced team beside you.',detail:'Get a practical view of your current technology, priorities and next steps.',bullets:['Digital transformation consulting','IT infrastructure planning and optimisation','Cloud and data backup solutions']},
    {slug:'ecommerce-solutions',title:'E-commerce Solutions',label:'Sell',summary:'Give customers a simple, dependable way to browse, buy and return.',detail:'Create an online store with clear product journeys, responsive design and appropriate payment integrations.',bullets:['Shopify and WooCommerce store setup','Payment gateway integration','Inventory and order management']},
    {slug:'tech-support-maintenance',title:'Tech Support & Maintenance',label:'Support',summary:'Keep your websites, systems and everyday technology running smoothly.',detail:'Stay on top of updates, system health and technical questions with support suited to your organisation.',bullets:['System and software updates','Website maintenance and development','Monitoring and ongoing IT support']},
    {slug:'cybersecurity-digital-skills',title:'Cybersecurity & Digital Skills',label:'Protect',summary:'Practical protection for your organisation and useful digital skills for your people.',detail:'Help teams reduce avoidable risks and build confidence using technology.',bullets:['Security reviews and hardening','Cyber awareness and digital literacy','Practical workshops for teams and communities']}
   ],
   projects:[
    ['Worldways One Ventures','Travel & business'],['Kenya Cyber Security and Forensics Authority','Cybersecurity'],['Kenya Cyber Security and Forensics Association','Cybersecurity'],['Institute of Cybersecurity and Forensics','Education & cybersecurity'],['Medrisk Consulting','Health consulting'],['Mojake Orphanage','Community'],['Happiness Children Home','Community']
   ].map(([title,category])=>({title,client:title,category,summary:'Client and partner organisation.'})),
   settings:[{site_name:'Worldways Web-Developers Ltd',contact_email:'info@worldwayswebdevelopers.co.ke',meta_description:'Technology services for businesses and organisations moving forward.'}],
   faqs:[
    {question:'What kinds of organisations do you work with?',answer:'We work with businesses, institutions and community organisations. We begin by understanding the audience, constraints and outcomes that matter to your team.'},
    {question:'Can you build a website and support it after launch?',answer:'Yes. Website development can include planning, design, implementation and ongoing maintenance. The exact scope is agreed before work begins.'},
    {question:'Do you work on existing software and websites?',answer:'We can review an existing site or system and discuss improvements, maintenance or a new direction based on its current condition and your goals.'},
    {question:'How do you price a project?',answer:'Pricing depends on the requirements, delivery timeline and support needed. Contact us with a short description and we will discuss a suitable scope and quotation.'},
    {question:'Can you provide cybersecurity training for our team?',answer:'Yes. Training can be adapted to your audience, work environment and the topics your organisation needs to address.'},
    {question:'How do I contact Worldways?',answer:'Use the enquiry form on this site or email info@worldwayswebdevelopers.co.ke.'}
   ]
  };
  for(const [type,entries] of Object.entries(starter))for(const data of entries)await pool.query('INSERT INTO cms_entries(type,data,is_published) VALUES($1,$2,true)',[type,data]);
 }
}
