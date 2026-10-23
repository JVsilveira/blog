import { z } from 'zod';
import { id, text, timestamp, status } from '../schemas';
const str = text.nullable();
const num = z.number().positive().nullable();
const bool = z.boolean().nullable();
export const fields = {
  manufacturerModelCode: str, region: str, ramGB: num, storageGB: num, chipset: str,
  screen: z.strictObject({ technology: str, sizeInches: num, resolution: str, refreshHz: num }).nullable(),
  dimensions: z.strictObject({ heightMm: num, widthMm: num, depthMm: num }).nullable(),
  weightG: num, batteryMah: num, chargingW: num, chargerIncluded: bool,
  cameras: z.array(z.strictObject({ lens: text, megapixels: num, ois: bool })).nullable(),
  connectivity: z.strictObject({ nfc: bool, esim: bool, networkBands: z.array(text).nullable() }).nullable(),
  ipRating: str, operatingSystemAtLaunch: str,
  updatePolicy: z.strictObject({ sourceId: id, announcedYears: num, securityEndDate: z.iso.date().nullable(), verifiedAt: timestamp }).nullable(),
};
export type Field = keyof typeof fields;
export const labels: Record<Field,string> = {
  manufacturerModelCode:'Código do fabricante', region:'Região', ramGB:'Memória RAM (GB)', storageGB:'Armazenamento (GB)', chipset:'Chipset',
  screen:'Tela', dimensions:'Dimensões (mm)', weightG:'Peso (g)', batteryMah:'Capacidade da bateria (mAh)', chargingW:'Carregamento (W)', chargerIncluded:'Carregador incluído', cameras:'Câmeras por lente', connectivity:'Conectividade', ipRating:'Proteção IP', operatingSystemAtLaunch:'Sistema no lançamento', updatePolicy:'Política de atualizações',
};
export const phoneSchema = z.strictObject({
  schemaVersion: z.literal(1), id, slug:id, status, createdAt:timestamp, updatedAt:timestamp,
  productId:id, verifiedAt:timestamp.nullable(), ownerApprovedAt:timestamp.nullable(),
  ...fields,
  offerIds: z.array(id).default([]),
  sourceIds: z.partialRecord(z.enum(Object.keys(fields) as [Field,...Field[]]), z.array(id)),
  editorial: z.strictObject({ method:z.enum(['documental','hands-on']), summary:text, bestFor:z.array(text).min(1), limitations:z.array(text).min(1), sourceIds:z.array(id).min(1), ownerApprovedAt:timestamp.nullable() }).nullable(),
});
export const phonesSchema = z.strictObject({schemaVersion:z.literal(1),variants:z.array(phoneSchema)});
export type Phone = z.infer<typeof phoneSchema>;
