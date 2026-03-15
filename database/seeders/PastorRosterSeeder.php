<?php

namespace Database\Seeders;

use App\Models\District;
use App\Models\Pastor;
use App\Models\Section;
use Illuminate\Database\Seeder;

class PastorRosterSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            DemoChurchHierarchySeeder::class,
        ]);

        $district = District::query()
            ->where('name', 'Central Luzon')
            ->firstOrFail();

        $this->seedSectionRoster($district, 'Section 2', $this->sectionTwoPastorNames());
        $this->seedSectionRoster($district, 'Section 3', $this->sectionThreePastorNames());
    }

    /**
     * @param  array<int, string>  $pastorNames
     */
    private function seedSectionRoster(District $district, string $sectionName, array $pastorNames): void
    {
        $section = Section::query()
            ->where('district_id', $district->id)
            ->where('name', $sectionName)
            ->firstOrFail();

        $normalizedNames = array_values(array_unique(array_map(
            static fn (string $name): string => trim($name),
            $pastorNames,
        )));

        foreach ($normalizedNames as $pastorName) {
            $pastor = Pastor::query()
                ->where('section_id', $section->id)
                ->where('pastor_name', $pastorName)
                ->first();

            if ($pastor === null) {
                $pastor = new Pastor([
                    'section_id' => $section->id,
                ]);
            }

            $pastor->fill([
                'section_id' => $section->id,
                'pastor_name' => $pastorName,
                'church_name' => 'UPC',
                'contact_number' => null,
                'email' => null,
                'address' => null,
                'status' => 'active',
            ])->save();
        }

        Pastor::query()
            ->where('section_id', $section->id)
            ->where('church_name', 'UPC')
            ->whereNull('contact_number')
            ->whereNull('email')
            ->whereNull('address')
            ->whereNotIn('pastor_name', $normalizedNames)
            ->whereDoesntHave('assignedUsers')
            ->whereDoesntHave('registrations')
            ->delete();
    }

    /**
     * @return array<int, string>
     */
    private function sectionThreePastorNames(): array
    {
        return [
            'Francis Alim',
            'Lee Alvarez',
            'Jhedmark Aquino',
            'Ramonito Barro',
            'Wilfredo Bautista',
            'Abraham Bejec',
            'John Blanco',
            'William Blasquino',
            'Venerando Boborol',
            'Rhodney Bruno',
            'Rona Bruno',
            'Leticia Buenaventura',
            'Rodolfo Buenaventura',
            'Jerome Caguiat',
            'Ronan Cahagnaan',
            'Rogelio Capili Jr',
            'Marlon Cayabyab',
            'Kim Colada',
            'Enrique Cristobal Jr.',
            'Dannilo Cuison',
            'Gina Cuison',
            'Neil Curitana',
            'Richard Dacia',
            'Armando Daquis',
            'Carl Dave',
            'Ruel Dela Cruz',
            'Erwin Devisfruto',
            'Raymond Devisfruto',
            'Rex Dionisio',
            'Noel Dominguez',
            'Annie Dumaguit',
            'George Dumaguit',
            'Jeruel Dumaguit',
            'Samuel Embalsado',
            'Mark Fallorin',
            'Serenida Fallorin',
            'Edward Famuleras',
            'Marilou Famuleras',
            'Norly Francisco',
            'Sailito Francisco',
            'Franchael Galura',
            'Christopher Gamboa',
            'Mercelita Garcia',
            'Rogelio Garcia',
            'Emerson Gigante',
            'Jomar Golloso',
            'Maritess Isiang',
            'Rhema Isiang',
            'Rosched Jardiolin',
            'Benjamin Lachica',
            'Rex Lachica',
            'Robert Lachica',
            'Hanaleel Lampa',
            'Kier Lampa',
            'Micah Laxamana',
            'Robert Laxamana',
            'Rogelito Laxamana',
            'Noel Lorijas',
            'Aaron Lusung',
            'Abigail Lusung',
            'Arnold Maglalang',
            'Jose Mangulabnan',
            'Reyzon Nebran',
            'Soledad Orpiada',
            'Tristan Orpiada',
            'Felix Ortinez',
            'Maritess Ortinez',
            'Ireneo Pagcu',
            'Teresita Pagcu',
            'Reynaldo Pasion Jr.',
            'Mary Pasion',
            'Edwin Peligrino Jr',
            'Abihail Peligrino',
            'Edwin Peligrino',
            'Jovita Peligrino',
            'Win Peligrino',
            'Caridad Ponio',
            'Danilo Ponio',
            'Erickson Salangsang',
            'Timothy Salangsang',
            'Algen Salvador',
            'Maricris Salvador',
            'Martin Salvador',
            'Ivanjo Sarmiento',
            'Johnny Sarmiento',
            'Monalisa Sarmiento',
            'Rocky Sarmiento',
            'Prince Ticsay',
            'Junar Tongol',
            'Jose Valenzuela',
            'Alex Villar',
            'Bella Yukong',
            'Jerry Yukong',
            'Charlie Zaspa',
        ];
    }

    /**
     * @return array<int, string>
     */
    private function sectionTwoPastorNames(): array
    {
        return [
            'Rodolfo Dela Rosa',
            'Reynaldo Diamante',
            'Joel Jr. Mabalay',
            'Rodolfo Castro',
            'Lito Ramon',
            'Purificacion Icang',
            'Ricky Abatay',
            'Elvin Urbano',
            'Joel Ayuda',
            'Vic Valentin',
            'Eduardo Jr. Icang',
            'Mary Grace Alindayu',
            'Villamor Pascua',
            'Ramil Regalado',
            'Edison Alindayu',
            'Ronaldo Regalado',
            'Gerry Pineda',
            'Belinda Urbano',
            'Reynaldo Casintahan',
            'Enrique Jr Erejer',
            'Beltran Alim',
            'Johan Mahinay',
            'Efren Ladrera',
            'Jesusa Cristina Diamante',
            'Maria Theresa Abatay',
            'Barbara Ann Dela Rosa',
            'Emil Peralta',
            'Orlando Calderon',
            'Elenito Dispe',
            'Virginia Jestingor',
            'Richie Zaspa',
            'Bernabe Castro',
            'May Llanes',
            'Celsie Valentin',
            'Edgardo Flores',
            'Rolando Esico',
            'Ferdinand Divina',
            'Mercedita Lupango',
            'Elpedio Perez',
            'Elmor Tenorio',
            'Roweno Gine',
            'Juanito Nantisa',
            'Maricel Tiangha',
            'Joselito Lim',
            'Victoria Erejer',
            'Andresito Tiangha',
            'Reynaldo Dela Vega',
            'John Jeremiah Diamante',
            'Elvin Mamelic',
            'Jeev Adaro',
            'Frias Genwine',
            'Charlito Petronio',
            'Reneboy Agcawili',
            'John Albert Parica',
            'Niel Castillo',
            'John Parado',
            'Rosemarie Tenorio',
            'Jerome Lupango',
            'Vanessa Esico',
            'Jeff Erejer',
            'Ric Igdalino',
            'Ronilon Montera',
            'Andres Capili',
            'Joseph Gonzales',
        ];
    }
}
