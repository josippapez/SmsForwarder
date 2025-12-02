import React from "react";
import {
  KeywordInputSection,
  PhoneNumberSection,
  CustomMessageSection,
} from "../../Components/Sections";

interface SimpleModeConfigurationProps {
  includes: { id: string; text: string }[];
  setIncludes: React.Dispatch<
    React.SetStateAction<{ id: string; text: string }[]>
  >;
  phoneNumber: string;
  setPhoneNumber: React.Dispatch<React.SetStateAction<string>>;
  body: string;
  setBody: React.Dispatch<React.SetStateAction<string>>;
}

const SimpleModeConfiguration: React.FC<SimpleModeConfigurationProps> = ({
  includes,
  setIncludes,
  phoneNumber,
  setPhoneNumber,
  body,
  setBody,
}) => (
  <>
    <KeywordInputSection includes={includes} setIncludes={setIncludes} />
    <PhoneNumberSection
      phoneNumber={phoneNumber}
      setPhoneNumber={setPhoneNumber}
    />
    <CustomMessageSection body={body} setBody={setBody} />
  </>
);

export default SimpleModeConfiguration;
