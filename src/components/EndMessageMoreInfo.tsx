import { assistantProfile } from "../assets/assitantProfile";

export const EndMessageMoreInfo: React.FC = () => (
    <div className="flex flex-col items-start mt-4">
      <div className="flex items-center mb-2">
      <img
          src={assistantProfile.image}
          alt="Assistant"
          className="w-14 h-14 rounded-full mr-4" 
        />
        <p className="text-center">{assistantProfile.name}</p>
      </div>
      <div className="bg-gray-100 border-gray-300 border-2 rounded-lg p-2 mr-20 w-full">
        <p>
          This is your code to continue the survey: <b>MYBMWCAR</b>. After the survey, you will receive a link to get more information about your BMW.
        </p>
      </div>
    </div>
  );