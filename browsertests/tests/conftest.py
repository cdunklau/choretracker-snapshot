import pytest
from selenium import webdriver


@pytest.fixture(scope='session')
def firefox_driver():
    """
    Session-global firefox driver. Probably don't use this in tests.
    """
    browser = webdriver.Firefox()#capabilities={'ensureCleanSession': True})
    yield browser
    browser.quit()


# TODO: Figure out how to clear everything besides cookies:
#       history, cache, localStorage, and sessionStorage.
@pytest.fixture
def firefox(firefox_driver):
    """
    Firefox driver with a new window, navigated to the root.
    """
    browser = firefox_driver
    browser.close()
    browser.start_session({})
    browser.get('http://localhost:3000')
    browser.delete_all_cookies()
    browser.execute_script(
        'window.localStorage.clear(); window.sessionStorage.clear()')
    yield browser
