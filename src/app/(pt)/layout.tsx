import { PublicationShell } from "../../components/PublicationShell";
import { baseMetadata } from "../../lib/site-metadata";
import "../globals.css";
export const metadata=baseMetadata;
export default function Layout({children}:{children:React.ReactNode}) {return <PublicationShell locale="pt">{children}</PublicationShell>;}
