import { Input } from 'antd';
import { CSSProperties } from 'react';

export function LabelTextField({
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
	onChange?: React.ChangeEventHandler<HTMLInputElement>;
	onBlur?: React.FocusEventHandler<HTMLInputElement> | undefined;
}) {
	return (
		<div className='flex items-center gap-[12px]'>
			<div className='text-xs text-gray w-[90px]'>{label}</div>
			<div className='flex items-center gap-[6px]'>
				<Input
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
