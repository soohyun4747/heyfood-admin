import { GetProp, UploadProps } from 'antd';
import { RcFile } from 'antd/es/upload';

export type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

export const getBase64 = (file: FileType): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = (error) => reject(error);
	});

export const getOriginFileObj = async (url: string, path: string) => {
	const response = await fetch(url);
	const blob = await response.blob();
	return new File([blob], path.split('/').pop() || 'image.jpg', {
		type: blob.type,
	}) as RcFile;
};
