import { PlusOutlined } from '@ant-design/icons';

export function UploadButton() {
	return (
		<button
			style={{ border: 0, background: 'none' }}
			type='button'>
			<PlusOutlined />
			<div style={{ marginTop: 8 }}>Upload</div>
		</button>
	);
}
