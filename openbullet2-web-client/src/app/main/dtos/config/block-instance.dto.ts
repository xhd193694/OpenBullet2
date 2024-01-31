import { SettingInputMode, VariableType } from "./block-descriptor.dto";

export enum BlockSettingType {
    None = 'none',
    Bool = 'bool',
    Int = 'int',
    Float = 'float',
    String = 'string',
    ListOfStrings = 'listOfStrings',
    DictionaryOfStrings = 'dictionaryOfStrings',
    ByteArray = 'byteArray',
    Enum = 'enum',
}

export enum BlockInstanceType {
    Auto = 'auto',
    HttpRequest = 'httpRequest',
    Keycheck = 'keycheck',
    Script = 'script',
    Parse = 'parse',
    LoliCode = 'loliCode',
}

export enum ParseMode {
    LR = 'lr',
    CSS = 'css',
    XPath = 'xPath',
    Json = 'json',
    Regex = 'regex',
}

export enum Interpreter {
    Jint = 'jint',
    NodeJS = 'nodeJS',
    IronPython = 'ironPython',
}

export enum KeychainMode {
    Or = 'or',
    And = 'and',
}

export enum KeyType {
    Bool = 'boolKey',
    Dictionary = 'dictionaryKey',
    List = 'listKey',
    Int = 'intKey',
    Float = 'floatKey',
    String = 'stringKey',
}

export enum BoolComparison {
    Is = 'is',
    IsNot = 'isNot',
}

export enum DictComparison {
    HasKey = 'hasKey',
    DoesNotHaveKey = 'doesNotHaveKey',
    HasValue = 'hasValue',
    DoesNotHaveValue = 'doesNotHaveValue',
    Exists = 'exists',
    DoesNotExist = 'doesNotExist',
}

export enum ListComparison {
    Contains = 'contains',
    DoesNotContain = 'doesNotContain',
    Exists = 'exists',
    DoesNotExist = 'doesNotExist',
}

export enum NumComparison {
    EqualTo = 'equalTo',
    NotEqualTo = 'notEqualTo',
    LessThan = 'lessThan',
    LessThanOrEqualTo = 'lessThanOrEqualTo',
    GreaterThan = 'greaterThan',
    GreaterThanOrEqualTo = 'greaterThanOrEqualTo',
}

export enum StrComparison {
    EqualTo = 'equalTo',
    NotEqualTo = 'notEqualTo',
    Contains = 'contains',
    DoesNotContain = 'doesNotContain',
    Exists = 'exists',
    DoesNotExist = 'doesNotExist',
    MatchesRegex = 'matchesRegex',
    DoesNotMatchRegex = 'doesNotMatchRegex',
}

export interface OutputVariable {
    type: VariableType;
    name: string;
}

export interface BlockSettingDto {
    name: string;
    inputVariableName: string | null;
    value: any;
    inputMode: SettingInputMode;
    type: BlockSettingType;
}

export interface BlockInstanceDto {
    id: string;
    disabled: boolean;
    label: string;
    settings: { [key: string]: BlockSettingDto };
}

export interface AutoBlockInstanceDto extends BlockInstanceDto {
    outputVariable: string;
    isCapture: boolean;
    safe: boolean;
    type: BlockInstanceType.Auto;
}

export interface ParseBlockInstanceDto extends BlockInstanceDto {
    outputVariable: string;
    recursive: boolean;
    isCapture: boolean;
    safe: boolean;
    mode: ParseMode;
    type: BlockInstanceType.Parse;
}

export interface LoliCodeBlockInstanceDto extends BlockInstanceDto {
    script: string;
    type: BlockInstanceType.LoliCode;
}

export interface ScriptBlockInstanceDto extends BlockInstanceDto {
    script: string;
    inputVariables: string; // Comma separated list of input variables
    interpreter: Interpreter;
    outputVariables: OutputVariable[];
    type: BlockInstanceType.Script;
}

export interface KeyDto {
    left?: BlockSettingDto;
    right?: BlockSettingDto;
}

export interface BoolKeyDto extends KeyDto {
    type: KeyType.Bool;
    comparison: BoolComparison;
}

export interface DictionaryKeyDto extends KeyDto {
    type: KeyType.Dictionary;
    comparison: DictComparison;
}

export interface ListKeyDto extends KeyDto {
    type: KeyType.List;
    comparison: ListComparison;
}

export interface IntKeyDto extends KeyDto {
    type: KeyType.Int;
    comparison: NumComparison;
}

export interface FloatKeyDto extends KeyDto {
    type: KeyType.Float;
    comparison: NumComparison;
}

export interface StringKeyDto extends KeyDto {
    type: KeyType.String;
    comparison: StrComparison;
}

export type KeyTypes =
    BoolKeyDto |
    DictionaryKeyDto |
    ListKeyDto |
    IntKeyDto |
    FloatKeyDto |
    StringKeyDto;

export interface KeychainDto {
    keys: KeyTypes[];
    mode: KeychainMode;
    resultStatus: string;
}

export interface KeycheckBlockInstanceDto extends BlockInstanceDto {
    keychains: KeychainDto[];
    type: BlockInstanceType.Keycheck;
}

export type BlockInstanceTypes =
    AutoBlockInstanceDto |
    ParseBlockInstanceDto |
    LoliCodeBlockInstanceDto |
    ScriptBlockInstanceDto |
    KeycheckBlockInstanceDto;
