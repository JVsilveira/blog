import { loadPublicContent } from '../../../lib/content';
export const dynamic = 'force-static';
export async function GET() { return Response.json((await loadPublicContent()).articles().map(({slug, title, description, tags, category, kind}) => ({slug, title, description, tags, category, kind}))); }
