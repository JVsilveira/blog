import { PortalPage } from "../../../features/publication/PortalPage";
import { collectionMetadata } from "../../../features/publication/metadata";
import { copy } from "../../../features/publication/i18n";
export function generateMetadata(){return collectionMetadata('pt',copy.pt.blog,'/blog/','blog');}
export default function Page(){return <PortalPage locale="pt" kind="blog"/>;}
