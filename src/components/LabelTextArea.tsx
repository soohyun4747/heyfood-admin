import { Input } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import { CSSProperties } from 'react';

export function LabelTextArea({
	label,
	placeholder,
	disabled,
	value,
	inputStyle,
	inputLabel,
	onChange,
	onBlur,
}: {
	label: string;
	placeholder?: string;
	disabled?: boolean;
	value?: string | number;
	inputStyle?: CSSProperties;
	inputLabel?: string;
	onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
	onBlur?: React.FocusEventHandler<HTMLTextAreaElement> | undefined;
}) {
	return (
		<div className='flex items-center gap-[12px]'>
			<div className='text-xs text-gray w-[90px]'>{label}</div>
			<div className='flex items-center gap-[6px]'>
				<TextArea
					value={value}
					placeholder={placeholder}
					disabled={disabled}
					onChange={onChange}
					onBlur={onBlur}
					style={{ width: 200, ...inputStyle }}
				/>
				<div className='text-xs text-gray'>{inputLabel}</div>
			</div>
		</div>
	);
}
