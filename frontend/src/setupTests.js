import jestFetchMock from 'jest-fetch-mock';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-15';

global.fetch = jestFetchMock;

Enzyme.configure({ adapter: new Adapter() });
