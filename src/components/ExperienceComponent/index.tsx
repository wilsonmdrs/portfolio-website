export interface ExperienceComponentProps {
  title: string;
  company: string;
  period: string;
  activities: string[];
}

export const ExperienceComponent = ({
  title,
  company,
  period,
  activities = [],
}: ExperienceComponentProps) => {
  return (
    <div className="experience-component">
      <p className="ec-title">{title}</p>
      <p className="ec-company">{company}</p>
      <p className="ec-period">{period}</p>
      <ul className="ec-activities">
        {activities.map((activity) => (
          <li className="ec-activity" key={activity}>
            {activity}
          </li>
        ))}
      </ul>
    </div>
  );
};
